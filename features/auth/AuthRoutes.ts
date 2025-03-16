import db from "../../db/db.ts";
import { Context, Router } from "jsr:@oak/oak";
import { hash, verify } from "jsr:@felix/argon2";
import { generateSalt, sanitizeStrings, sendResponse, validateData } from "../utils/helpers.ts";
import { loginSchema, registerSchema } from "../../zod/auth.ts";
import { HttpError } from "../utils/classes.ts";
import { generateJWT, verifyJWT } from "../utils/jwt.ts";

const authRoutes = new Router();

const REFRESH_TOKEN_EXP = 432000;
const ACCESS_TOKEN_EXP = 900;

authRoutes.post("/login", async (ctx: Context) => {
    const body = await ctx.request.body.json();
    const verifiedBody = validateData(loginSchema, body);
    const sanitizedBody = sanitizeStrings(verifiedBody) as { email: string; password: string };

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

    const refreshToken = await generateJWT(data, REFRESH_TOKEN_EXP);
    const accessToken = await generateJWT(data, ACCESS_TOKEN_EXP);

    ctx.cookies.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: Deno.env.get("DENO_ENV") === "production",
        sameSite: "strict",
        path: "/",
        maxAge: REFRESH_TOKEN_EXP * 1000,
    });

    ctx.cookies.set("access_token", accessToken, {
        httpOnly: true,
        secure: Deno.env.get("DENO_ENV") === "production",
        sameSite: "strict",
        path: "/",
        maxAge: ACCESS_TOKEN_EXP * 1000,
    });

    sendResponse(ctx, 200, { data });
});

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

authRoutes.get("/logout", (ctx: Context) => {
    ctx.cookies.set("refresh_token", "", {
        httpOnly: true,
        secure: Deno.env.get("DENO_ENV") === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
    });
    ctx.cookies.set("access_token", "", {
        httpOnly: true,
        secure: Deno.env.get("DENO_ENV") === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
    });

    console.log("deleting cookies");

    sendResponse(ctx, 200, "Logged out");
});

authRoutes.delete("/delete", (ctx: Context) => {
    //Check if token is valid
    //Extract email or id from token
    //Find user with that email or id
    //Delete user from _USER table

    sendResponse(ctx, 200, "Delete");
});

authRoutes.get("/auth-check", async (ctx: Context) => {
    const currentTime = Math.floor(Date.now() / 1000);

    const accessToken = await ctx.cookies.get("access_token");
    const refreshToken = await ctx.cookies.get("refresh_token");

    if (!refreshToken) return sendResponse(ctx, 401, "Missing refresh token, please login...");

    const verifiedRefreshToken = (await verifyJWT(refreshToken)) as {
        id: string;
        email: string;
        name: string;
        image: string;
        exp: number;
    };

    if (!verifiedRefreshToken) {
        ctx.cookies.set("refresh_token", "", {
            httpOnly: true,
            secure: Deno.env.get("DENO_ENV") === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 0,
        });
        ctx.cookies.set("refresh_token", "", {
            httpOnly: true,
            secure: Deno.env.get("DENO_ENV") === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 0,
        });

        throw new HttpError(401, "Expired token", ["Refresh token expired"]);
    }

    if (!accessToken && verifiedRefreshToken.exp > currentTime) {
        const newRefreshToken = await generateJWT(
            {
                id: verifiedRefreshToken.id,
                email: verifiedRefreshToken.email,
                name: verifiedRefreshToken.name,
                image: verifiedRefreshToken.image,
            },
            REFRESH_TOKEN_EXP
        );

        const newAccessToken = await generateJWT(
            {
                id: verifiedRefreshToken.id,
                email: verifiedRefreshToken.email,
                name: verifiedRefreshToken.name,
                image: verifiedRefreshToken.image,
            },
            ACCESS_TOKEN_EXP
        );

        ctx.cookies.set("refresh_token", newRefreshToken, {
            httpOnly: true,
            secure: Deno.env.get("DENO_ENV") === "production",
            sameSite: "strict",
            path: "/",
            maxAge: REFRESH_TOKEN_EXP * 1000,
        });

        ctx.cookies.set("access_token", newAccessToken, {
            httpOnly: true,
            secure: Deno.env.get("DENO_ENV") === "production",
            sameSite: "strict",
            path: "/",
            maxAge: ACCESS_TOKEN_EXP * 1000,
        });

        //Black list refresh token

        return sendResponse(ctx, 200, verifiedRefreshToken);
    }

    sendResponse(ctx, 200, verifiedRefreshToken);
});

export default authRoutes;
