import { Context } from "jsr:@oak/oak";
import { verifyJWT } from "../features/utils/jwt.ts";
import { HttpError } from "../features/utils/classes.ts";
import { logMessage } from "../features/utils/logger.ts";

const RATE_LIMIT = 10; // allowed requests per window
const WINDOW_MS = 60 * 1000; // window duration in milliseconds (e.g. 1 minute)

const clientRequests = new Map<string, { count: number; startTime: number }>();

export async function rateLimiter(ctx: Context, next: any) {
    const accessToken = await ctx.cookies.get("access_token");

    let verifiedAccessToken = null;

    if (accessToken) {
        verifiedAccessToken = (await verifyJWT(accessToken)) as { id: string };
    }

    const clientId = verifiedAccessToken?.id || ctx.request.ip || "unknown";

    const now = Date.now();

    let requestData = clientRequests.get(clientId);

    if (!requestData) {
        requestData = { count: 1, startTime: now };
        clientRequests.set(clientId, requestData);
    } else {
        if (now - requestData.startTime > WINDOW_MS) {
            requestData.count = 1;
            requestData.startTime = now;
        } else {
            requestData.count++;
        }
    }

    if (requestData.count > RATE_LIMIT) {
        logMessage("error", "Rate limit hit", clientId);
        throw new HttpError(429, "Ratelimit reached", ["Too many requests. Please try again later."]);
    }

    await next();
}
