import { Context, Middleware } from "jsr:@oak/oak";

const allowedOrigin = "http://localhost:5173"; // Replace with your frontend URL

const corsMiddleware: Middleware = async (ctx: Context, next) => {
    const origin = ctx.request.headers.get("Origin");

    if (origin === allowedOrigin) {
        ctx.response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
        ctx.response.headers.set("Access-Control-Allow-Credentials", "true");
        ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        ctx.response.headers.set("Access-Control-Expose-Headers", "Content-Type, Authorization");
    }

    // Handle preflight OPTIONS request
    if (ctx.request.method === "OPTIONS") {
        ctx.response.status = 204;
        return;
    }

    await next();
};

export { corsMiddleware };
