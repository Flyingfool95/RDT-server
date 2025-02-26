import { Context, Router } from "jsr:@oak/oak";
import { sanitizeStrings, sendResponse, validateData } from "../utils/helpers.ts";
import { loginSchema } from "../../../shared/zod/auth.js";
import { IUser } from "../../../shared/types/auth.ts";
import db from "../../db/db.ts";
import { HttpError } from "../utils/classes.ts";

const authRoutes = new Router();

authRoutes.post("/login", async (ctx: Context) => {
    const body = await ctx.request.body.json();
    const validatedBody = validateData(loginSchema, body);
    const sanitizedBody = sanitizeStrings(validatedBody) as { email: string; password: string };

    //TODO Fined based on hashed password and email
    const results = db.query(`SELECT id, email, name, image, role FROM users WHERE email = ?`, [sanitizedBody.email]);

    if (!results.length) throw new HttpError(404, "User not found", ["No user with those credentials"]);

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

authRoutes.post("/register", (ctx: Context) => {
    const id = crypto.randomUUID();
    const email = "Jhernehult@gmail.com";
    const password = "123123123";
    const results = db.query("INSERT INTO users (id, email, name, image, role, password) VALUES (?, ?, ?, ?, ?, ?)", [
        id,
        email,
        "",
        "",
        "user",
        password,
    ]);

    console.log(results);

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
