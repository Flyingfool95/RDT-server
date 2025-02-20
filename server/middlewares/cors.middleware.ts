import { Context, Middleware } from "jsr:@oak/oak";

// CORS Middleware Function
const corsMiddleware: Middleware = async (ctx: Context, next) => {
    // Allow all origins or customize it to restrict specific origins
    ctx.response.headers.set("Access-Control-Allow-Origin", "*");

    // Allow specific HTTP methods
    ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

    // Allow specific headers, or set a wildcard for all headers
    ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Handle preflight OPTIONS request
    if (ctx.request.method === "OPTIONS") {
        ctx.response.status = 200;
        return; // Return early for OPTIONS requests
    }

    // Continue to the next middleware or route handler
    await next();
};

export { corsMiddleware };
