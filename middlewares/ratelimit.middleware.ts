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

const clientRequests = new Map<string, RequestData & { blocked?: boolean }>();

export async function rateLimiter(ctx: Context, next: Next): Promise<void> {
    const accessToken = await ctx.cookies.get("access_token");
    const verifiedAccessToken = accessToken ? ((await verifyJWT(accessToken)) as { id: string }) : null;
    const clientId = verifiedAccessToken?.id || ctx.request.ip || "unknown";
    const now = Date.now();

    let requestData = clientRequests.get(clientId);

    if (requestData && now - requestData.startTime > WINDOW_MS) {
        clientRequests.delete(clientId);
        requestData = undefined;
    }

    if (requestData?.blocked) {
        throw new HttpError(429, "Rate limit exceeded", ["Too many requests. Please try again later."]);
    }

    if (!requestData) {
        requestData = { count: 1, startTime: now };
        clientRequests.set(clientId, requestData);
    } else {
        requestData.count++;
    }

    if (requestData.count > RATE_LIMIT) {
        requestData.blocked = true;
        requestData.startTime = now;

        logMessage("error", "Rate limit exceeded", {
            clientIp: ctx.request.ip,
            userId: clientId !== ctx.request.ip ? clientId : undefined,
            requestCount: requestData.count,
        });

        throw new HttpError(429, "Rate limit exceeded", ["Too many requests. Please try again later."]);
    }

    await next();
}
