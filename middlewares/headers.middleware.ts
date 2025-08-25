import { Context, Middleware, Next } from "jsr:@oak/oak";

const headersMiddleware: Middleware = async (ctx: Context, next: Next) => {
    ctx.response.headers.set("X-Frame-Options", "DENY");
    ctx.response.headers.set("X-Content-Type-Options", "nosniff");

    await next();
};

export { headersMiddleware };
