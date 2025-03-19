import db from "../../db/db.ts";
import { Context, Router } from "jsr:@oak/oak";
import { hash, verify } from "jsr:@felix/argon2";
import {
    checkIfUserExists,
    deleteJWTTokens,
    generateSalt,
    getUser,
    sanitizeStrings,
    sendResponse,
    validateAccessToken,
    validateData,
} from "../utils/helpers.ts";
import { loginSchema, registerSchema, userSchema } from "../../zod/auth.ts";
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

    const userData = getUser(sanitizedBody.email);

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

    //Check if user with email alredy exists
    const userExists = checkIfUserExists("email", sanitizedBody.email);

    if (userExists) {
        throw new HttpError(401, "User already exists", ["User already exists"]);
    }

    db.query("INSERT INTO users (id, email, name, role, password) VALUES (?, ?, ?, ?, ?)", [
        id,
        sanitizedBody.email,
        "",
        "user",
        hashedPassword,
    ]);

    sendResponse(ctx, 201, "Register");
});

/* AUTH UPDATE */
authRoutes.put("/update", async (ctx: Context) => {
    const verifiedAccessToken = await validateAccessToken(ctx);

    const userExists = checkIfUserExists("id", verifiedAccessToken.id);

    if (!userExists) throw new HttpError(401, "User does not exist", ["User not found"]);

    const body = await ctx.request.body.json();

    const verifiedBody = validateData(userSchema, body);

    const sanitizedBody = sanitizeStrings(verifiedBody) as {
        id: string;
        email: string;
        name: string;
        role: string;
    };

    const updatedUser = db.query(
        `UPDATE users 
         SET email = ?, name = ?, role = ? 
         WHERE id = ?`,
        [sanitizedBody.email, sanitizedBody.name, sanitizedBody.role, verifiedAccessToken.id]
    );

    console.log(updatedUser);

    sendResponse(ctx, 200, "User updated successfully");
});

/* AUTH LOGOUT */
authRoutes.get("/logout", (ctx: Context) => {
    deleteJWTTokens(ctx);

    sendResponse(ctx, 200, "Logged out");
});

/* AUTH DELETE */
authRoutes.delete("/delete", async (ctx: Context) => {
    const verifiedAccessToken = await validateAccessToken(ctx);

    const userExists = checkIfUserExists("id", verifiedAccessToken.id);

    if (!userExists) throw new HttpError(401, "User does not exist", ["User not found"]);

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

    if (!accessToken && verifiedRefreshToken.exp > currentTime) {
        const newRefreshToken = await generateJWT(
            {
                id: verifiedRefreshToken.id,
                email: verifiedRefreshToken.email,
                name: verifiedRefreshToken.name,
            },
            REFRESH_TOKEN_EXP
        );

        const newAccessToken = await generateJWT(
            {
                id: verifiedRefreshToken.id,
                email: verifiedRefreshToken.email,
                name: verifiedRefreshToken.name,
            },
            ACCESS_TOKEN_EXP
        );

        setCookie(ctx, "refresh_token", newRefreshToken, { maxAge: REFRESH_TOKEN_EXP });
        setCookie(ctx, "access_token", newAccessToken, { maxAge: ACCESS_TOKEN_EXP });

        //Black list refresh token

        return sendResponse(ctx, 200, verifiedRefreshToken);
    }

    sendResponse(ctx, 200, verifiedRefreshToken);
});

export default authRoutes;

/* TEST TO SEE IF ALL WORKS + UPDATES */
