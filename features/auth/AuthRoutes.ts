import db from "../../db/db.ts";
import { Context, Router } from "jsr:@oak/oak";
import { hash, verify } from "jsr:@felix/argon2";
import { generateSalt, sanitizeStrings, sendResponse, validateData } from "../utils/helpers.ts";
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

    const results = db.query(`SELECT id, email, name, image, role, password FROM users WHERE email = ?`, [
        sanitizedBody.email,
    ]);
    if (!results.length) throw new HttpError(401, "Login failed", ["User doesn't exist"]);

    const isMatch = await verify(results[0][5] as string, sanitizedBody.password);
    if (!isMatch) throw new HttpError(401, "Login failed", ["Incorrect credentials"]);

    const data = {
        id: results[0][0],
        email: results[0][1],
        name: results[0][2],
        image: results[0][3],
        role: results[0][4],
    };

    const refreshToken = await generateJWT(data, REFRESH_TOKEN_EXP);
    const accessToken = await generateJWT(data, ACCESS_TOKEN_EXP);

    setCookie(ctx, "refresh_token", refreshToken, { maxAge: REFRESH_TOKEN_EXP });
    setCookie(ctx, "access_token", accessToken, { maxAge: ACCESS_TOKEN_EXP });

    sendResponse(ctx, 200, { data });
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
    const accessToken = await ctx.cookies.get("access_token");
    if (!accessToken) throw new HttpError(401, "Unauthorized", ["Missing access token"]);

    const verifiedAccessToken = (await verifyJWT(accessToken)) as {
        id: string;
        email: string;
        name: string;
        role: string;
        exp: number;
    };

    if (!verifiedAccessToken) {
        ctx.cookies.delete("refresh_token");
        ctx.cookies.delete("access_token");

        throw new HttpError(401, "Expired token", ["Access token expired"]);
    }

    const userExists = db.query(`SELECT * FROM users WHERE id = ?`, [verifiedAccessToken.id]);

    if (!userExists || userExists.length === 0) {
        throw new HttpError(404, "User not found", ["No user found with given ID"]);
    }

    const body = await ctx.request.body.json();

    const verifiedBody = validateData(userSchema, body);

    const sanitizedBody = sanitizeStrings(verifiedBody) as {
        id?: string;
        email?: string;
        name?: string;
        password?: string;
        role?: string;
    };

    const updatedUser = db.query(
        `UPDATE users 
         SET email = ?, name = ?, password = ?, role = ? 
         WHERE id = ?`,
        [sanitizedBody.email, sanitizedBody.name, sanitizedBody.password, sanitizedBody.role, verifiedAccessToken.id]
    );

    console.log(updatedUser);

    sendResponse(ctx, 200, "User updated successfully");
});

/* AUTH LOGOUT */
authRoutes.get("/logout", (ctx: Context) => {
    ctx.cookies.delete("refresh_token");
    ctx.cookies.delete("access_token");

    sendResponse(ctx, 200, "Logged out");
});

/* AUTH DELETE */
authRoutes.delete("/delete", async (ctx: Context) => {
    const accessToken = await ctx.cookies.get("access_token");
    if (!accessToken) throw new HttpError(401, "Unauthorized delete", ["Missing access token"]);

    const verifiedAccessToken = (await verifyJWT(accessToken)) as {
        id: string;
        email: string;
        name: string;
        role: string;
        exp: number;
    };

    if (!verifiedAccessToken) {
        ctx.cookies.delete("refresh_token");
        ctx.cookies.delete("access_token");

        throw new HttpError(401, "Expired token", ["Access token expired"]);
    }

    const userExists = db.query(`SELECT * FROM users WHERE id = ?`, [verifiedAccessToken.id]);

    if (!userExists || userExists.length === 0) {
        throw new HttpError(404, "User not found", ["No user found with given ID"]);
    }

    db.query(`DELETE FROM users WHERE id = ?`, [verifiedAccessToken.id]);

    ctx.cookies.delete("refresh_token");
    ctx.cookies.delete("access_token");

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
        ctx.cookies.delete("refresh_token");
        ctx.cookies.delete("access_token");

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
