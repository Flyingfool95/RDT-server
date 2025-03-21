import db from "../../db/db.ts";
import { Context, Router } from "jsr:@oak/oak";
import { hash, verify } from "jsr:@felix/argon2";
import {
    getUserIfExists,
    deleteJWTTokens,
    generateSalt,
    sanitizeStrings,
    sendResponse,
    verifyAccessToken,
    validateData,
} from "../utils/helpers.ts";
import { loginSchema, registerSchema, updateUserSchema } from "../../zod/auth.ts";
import { HttpError } from "../utils/classes.ts";
import { generateJWT, verifyJWT } from "../utils/jwt.ts";
import { setCookie } from "../utils/helpers.ts";

const authRoutes = new Router();

const REFRESH_TOKEN_EXP = 432000;
const ACCESS_TOKEN_EXP = 900;

/* AUTH LOGIN */
authRoutes.post("/login", async (ctx: Context) => {
    const body = await ctx.request.body.json();
    const verifiedBody = validateData(loginSchema, body);
    const sanitizedBody = sanitizeStrings(verifiedBody) as { email: string; password: string };

    const userData = getUserIfExists("email", sanitizedBody.email);
    if (!userData) throw new HttpError(401, "User does not exist", ["User not found"]);

    const isMatch = await verify(userData.password as string, sanitizedBody.password);
    if (!isMatch) throw new HttpError(401, "Login failed", ["Incorrect credentials"]);

    const refreshToken = await generateJWT(
        { id: userData.id, email: userData.email, name: userData.name, role: userData.role },
        REFRESH_TOKEN_EXP
    );
    const accessToken = await generateJWT(
        { id: userData.id, email: userData.email, name: userData.name, role: userData.role },
        ACCESS_TOKEN_EXP
    );

    setCookie(ctx, "refresh_token", refreshToken, { maxAge: REFRESH_TOKEN_EXP });
    setCookie(ctx, "access_token", accessToken, { maxAge: ACCESS_TOKEN_EXP });

    sendResponse(ctx, 200, { id: userData.id, email: userData.email, name: userData.name, role: userData.role });
});

/* AUTH REGISTER */
authRoutes.post("/register", async (ctx: Context) => {
    const body = await ctx.request.body.json();
    const verifiedBody = validateData(registerSchema, body);
    const sanitizedBody = sanitizeStrings(verifiedBody) as {
        email: string;
        password: string;
        confirmPassword: string;
    };

    const id = crypto.randomUUID();
    const salt = generateSalt(24);
    const hashedPassword = await hash(sanitizedBody.password, {
        salt,
    });

    const userData = getUserIfExists("email", sanitizedBody.email);

    if (userData) throw new HttpError(401, "User already exists", ["User already exists"]);

    db.query("INSERT INTO users (id, email, name, role, password) VALUES (?, ?, ?, ?, ?)", [
        id,
        sanitizedBody.email,
        "",
        "user",
        hashedPassword,
    ]);

    sendResponse(ctx, 201, "Register");
});

authRoutes.put("/update", async (ctx: Context) => {
    const verifiedAccessToken = await verifyAccessToken(ctx);

    const currentUser = getUserIfExists("id", verifiedAccessToken.id);
    if (!currentUser) throw new HttpError(401, "Unauthorized");

    const body = await ctx.request.body.json();
    const verifiedBody = validateData(updateUserSchema, body);
    const sanitizedBody = sanitizeStrings(verifiedBody) as {
        email: string;
        name: string;
        newPassword: string;
        currentPassword: string;
    };

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (sanitizedBody.newPassword) {
        if (!sanitizedBody.currentPassword) {
            throw new HttpError(400, "Current password required");
        }

        const passwordValid = await verify(currentUser.password as string, sanitizedBody.currentPassword);

        if (!passwordValid) {
            throw new HttpError(401, "Invalid current password");
        }

        updateFields.push("password = ?");
        const salt = generateSalt(24);
        updateValues.push(await hash(sanitizedBody.newPassword), {
            salt,
        });
    }

    if (sanitizedBody.email) {
        updateFields.push("email = ?");
        updateValues.push(sanitizedBody.email);
    }

    if (sanitizedBody.name) {
        updateFields.push("name = ?");
        updateValues.push(sanitizedBody.name);
    }

    if (updateFields.length === 0) {
        throw new HttpError(400, "No valid fields to update");
    }

    const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
    updateValues.push(verifiedAccessToken.id);

    db.query(query, updateValues);

    const updatedUser = getUserIfExists("id", verifiedAccessToken.id);
    if (!updatedUser) throw new HttpError(401, "User doesn't exist");

    const safeUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
    };

    sendResponse(ctx, 200, safeUser);
});

/* AUTH LOGOUT */
authRoutes.get("/logout", (ctx: Context) => {
    deleteJWTTokens(ctx);
    sendResponse(ctx, 200, "Logged out");
});

/* AUTH DELETE */
authRoutes.delete("/delete", async (ctx: Context) => {
    const verifiedAccessToken = await verifyAccessToken(ctx);
    const userData = getUserIfExists("id", verifiedAccessToken.id);
    if (!userData) throw new HttpError(401, "User does not exist", ["User not found"]);

    db.query(`DELETE FROM users WHERE id = ?`, [verifiedAccessToken.id]);

    deleteJWTTokens(ctx);

    sendResponse(ctx, 200, "User deleted successfully");
});

/* AUTH CHECK */
authRoutes.get("/auth-check", async (ctx: Context) => {
    const currentTime = Math.floor(Date.now() / 1000);

    const accessToken = await ctx.cookies.get("access_token");
    const refreshToken = await ctx.cookies.get("refresh_token");
    if (!refreshToken) return sendResponse(ctx, 401, "Missing refresh token, please login...");

    const verifiedRefreshToken = (await verifyJWT(refreshToken)) as {
        id: string;
        email: string;
        name: string;
        role: string;
        exp: number;
    };

    if (!verifiedRefreshToken) {
        deleteJWTTokens(ctx);
        throw new HttpError(401, "Expired token", ["Refresh token expired"]);
    }

    const userData = getUserIfExists("id", verifiedRefreshToken.id);
    if (!userData) throw new HttpError(401, "User doesn't exist");

    if (!accessToken && verifiedRefreshToken.exp > currentTime) {
        const newRefreshToken = await generateJWT(
            {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                role: userData.role,
            },
            REFRESH_TOKEN_EXP
        );

        const newAccessToken = await generateJWT(
            {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                role: userData.role,
            },
            ACCESS_TOKEN_EXP
        );

        setCookie(ctx, "refresh_token", newRefreshToken, { maxAge: REFRESH_TOKEN_EXP });
        setCookie(ctx, "access_token", newAccessToken, { maxAge: ACCESS_TOKEN_EXP });

        //Black list refresh token

        return sendResponse(ctx, 200, {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
        });
    }

    sendResponse(ctx, 200, {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
    });
});

export default authRoutes;

