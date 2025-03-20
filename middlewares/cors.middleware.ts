import { Context, Middleware } from "jsr:@oak/oak";

const allowedOrigins = new Set(["http://localhost:5173"]);

const corsMiddleware: Middleware = async (ctx: Context, next) => {
    const origin = ctx.request.headers.get("Origin");

    if (origin && allowedOrigins.has(origin)) {
        ctx.response.headers.set("Access-Control-Allow-Origin", origin);
        ctx.response.headers.set("Access-Control-Allow-Credentials", "true");
        ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        ctx.response.headers.set("Access-Control-Expose-Headers", "Content-Type, Authorization");
    }

    if (ctx.request.method === "OPTIONS") {
        ctx.response.status = 204;
        return;
    }

    await next();
};

export { corsMiddleware };
