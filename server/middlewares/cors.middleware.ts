import { Context, Middleware } from "jsr:@oak/oak";

const corsMiddleware: Middleware = async (ctx: Context, next) => {
    const origin = ctx.request.headers.get("Origin") || "*"; // Get the request origin

    // Allow only specific frontend origin (Replace with your actual frontend URL)
    ctx.response.headers.set("Access-Control-Allow-Origin", origin);

    // Allow credentials (if using authentication headers like Authorization)
    ctx.response.headers.set("Access-Control-Allow-Credentials", "true");

    // Allow HTTP methods
    ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

    // Allow specific headers
    ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Inform browser that response headers can be exposed
    ctx.response.headers.set("Access-Control-Expose-Headers", "Content-Type, Authorization");

    // Handle preflight OPTIONS request
    if (ctx.request.method === "OPTIONS") {
        ctx.response.status = 204; // 204 No Content is better for preflight
        return;
    }

    await next();
};

export { corsMiddleware };
