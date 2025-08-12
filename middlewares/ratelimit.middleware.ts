import { Context, Next } from "jsr:@oak/oak";
import { verifyJWT } from "../features/utils/jwt/jwt.ts";
import { HttpError } from "../features/utils/classes/classes.ts";
import { logMessage } from "../features/utils/logger/logger.ts";

const RATE_LIMIT = 30; // Allowed requests per window
const WINDOW_MS = 60 * 1000; // Window duration in milliseconds (1 minute)

interface RequestData {
    count: number;
    startTime: number;
}

const clientRequests = new Map<string, RequestData>();

export async function rateLimiter(ctx: Context, next: Next): Promise<void> {
    console.log(clientRequests)
    const accessToken = await ctx.cookies.get("access_token");
    const verifiedAccessToken = accessToken ? ((await verifyJWT(accessToken)) as { id: string }) : null;
    const clientId = verifiedAccessToken?.id || ctx.request.ip || "unknown";
    const now = Date.now();

    let requestData = clientRequests.get(clientId);

    // Clean up expired entry immediately when accessed
    if (requestData && now - requestData.startTime > WINDOW_MS) {
        clientRequests.delete(clientId);
        requestData = undefined;
    }

    if (!requestData) {
        requestData = { count: 1, startTime: now };
        clientRequests.set(clientId, requestData);
    } else {
        requestData.count++;
    }

    if (requestData.count > RATE_LIMIT) {
        logMessage("error", "Rate limit exceeded", {
            clientIp: ctx.request.ip,
            userId: clientId !== ctx.request.ip ? clientId : undefined,
            requestCount: requestData.count,
        });
        throw new HttpError(429, "Rate limit exceeded", ["Too many requests. Please try again later."]);
    }

    await next();
}

// Periodic cleanup for unused entries (optional, for memory management)
setInterval(() => {
    const now = Date.now();
    for (const [clientId, data] of clientRequests) {
        if (now - data.startTime > WINDOW_MS) {
            clientRequests.delete(clientId);
        }
    }
}, WINDOW_MS * 2); // Run less frequently
