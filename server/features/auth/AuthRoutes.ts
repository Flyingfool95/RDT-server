import { Context, Router } from "jsr:@oak/oak";
import { sanitizeStrings, sendResponse, validateData } from "../utils/helpers.ts";
import { loginSchema, registerSchema } from "../../../shared/zod/auth.js";
import { IUser } from "../../../shared/types/auth.ts";
import db from "../../db/db.ts";
import { HttpError } from "../utils/classes.ts";

const authRoutes = new Router();

authRoutes.post("/login", async (ctx: Context) => {
    const body = await ctx.request.body.json();
    const validatedBody = validateData(loginSchema, body);
    const sanitizedBody = sanitizeStrings(validatedBody) as { email: string; password: string };

    //TODO Find based on email and hashed password
    const results = db.query(`SELECT id, email, name, image, role FROM users WHERE email = ?`, [sanitizedBody.email]);

    if (!results.length) throw new HttpError(401, "Login failed", ["Email or password is incorrect"]);

    const data = {
        id: results[0][0],
        email: results[0][1],
        name: results[0][2],
        image: results[0][3],
        role: results[0][4],
    };

    console.log(data);
    
    //Generate JWT access and refresh tokens and set in httponly secure cookies

    sendResponse(ctx, 200, data);
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

    //Hash password before adding to db

    db.query("INSERT INTO users (id, email, name, image, role, password) VALUES (?, ?, ?, ?, ?, ?)", [
        id,
        sanitizedBody.email,
        "",
        "",
        "user",
        sanitizedBody.password,
    ]);

    sendResponse(ctx, 200, "Register");
});

authRoutes.post("/update", (ctx: Context) => {
    sendResponse(ctx, 200, "Update");
});

authRoutes.post("/delete", (ctx: Context) => {
    sendResponse(ctx, 200, "Delete");
});

authRoutes.get("/whoami", (ctx: Context) => {
    sendResponse(ctx, 200, "You are you!");
});

export default authRoutes;
