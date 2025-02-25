import { Context, Router } from "jsr:@oak/oak";
import { sendResponse } from "../shared/helpers.ts";

const authRoutes = new Router();

authRoutes.post("/login", async (ctx: Context) => {
    console.log(await ctx.request.body.json());

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
