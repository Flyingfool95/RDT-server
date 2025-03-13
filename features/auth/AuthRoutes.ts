import { Context, Router } from "jsr:@oak/oak";
import { hash, verify } from "jsr:@felix/argon2";
import { setCookie } from "jsr:@std/http/cookie";

import db from "../../db/db.ts";
import { generateSalt, sanitizeStrings, sendResponse, validateData } from "../utils/helpers.ts";
import { loginSchema, registerSchema } from "../../zod/auth.ts";
import { HttpError } from "../utils/classes.ts";
import { generateJWT } from "../utils/jwt.ts";

const authRoutes = new Router();

authRoutes.post("/login", async (ctx: Context) => {
    const body = await ctx.request.body.json();
    const validatedBody = validateData(loginSchema, body);
    const sanitizedBody = sanitizeStrings(validatedBody) as { email: string; password: string };

    const results = db.query(`SELECT id, email, name, image, role, password FROM users WHERE email = ?`, [
        sanitizedBody.email,
    ]);
    if (!results.length) throw new HttpError(401, "Login failed", ["Incorrect credentials"]);

    const isMatch = await verify(results[0][5] as string, sanitizedBody.password);
    if (!isMatch) throw new HttpError(401, "Login failed", ["Incorrect credentials"]);

    const data = {
        id: results[0][0],
        email: results[0][1],
        name: results[0][2],
        image: results[0][3],
        role: results[0][4],
    };

    const accessToken = await generateJWT(data, 900);
    const refreshToken = await generateJWT(data, 604800);

    setCookie(ctx.response.headers, {
        name: "refresh_token",
        value: refreshToken,
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        path: "/",
        maxAge: 604800,
    });

    sendResponse(ctx, 200, { accessToken, data });
});

authRoutes.post("/register", async (ctx: Context) => {
    const body = await ctx.request.body.json();

    const validatedBody = validateData(registerSchema, body);
    const sanitizedBody = sanitizeStrings(validatedBody) as {
        email: string;
        password: string;
        confirmPassword: string;
    };

    const id = crypto.randomUUID();
    const salt = generateSalt(24);
    const hashedPassword = await hash(sanitizedBody.password, {
        salt,
    });

    db.query("INSERT INTO users (id, email, name, image, role, password) VALUES (?, ?, ?, ?, ?, ?)", [
        id,
        sanitizedBody.email,
        "",
        "",
        "user",
        hashedPassword,
    ]);

    sendResponse(ctx, 201, "Register");
});

authRoutes.patch("/update", (ctx: Context) => {
    sendResponse(ctx, 200, "Update");
});

authRoutes.delete("/delete", (ctx: Context) => {
    //Check if token is valid
    //Extract email or id from token
    //Find user with that email or id
    //Delete user from _USER table

    sendResponse(ctx, 200, "Delete");
});

authRoutes.get("/refresh", (ctx: Context) => {
    sendResponse(ctx, 200, "Token refreshed!");
});

export default authRoutes;
