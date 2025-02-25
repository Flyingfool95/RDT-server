import { Context, Router } from "jsr:@oak/oak";
import { sanitizeStrings, sendResponse, validateData } from "../shared/helpers.ts";
import { loginSchema } from "../../../shared/zod/auth.js";

const authRoutes = new Router();

authRoutes.post("/login", async (ctx: Context) => {
    const body = await ctx.request.body.json();
    const validatedBody = validateData(loginSchema, body);
    const sanitizedBody = sanitizeStrings(validatedBody);
    console.log(sanitizedBody);

    //Check against db with sanitizedBody using parameterized queries

    sendResponse(ctx, 200, "Login");
});

authRoutes.post("/register", (ctx: Context) => {
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
