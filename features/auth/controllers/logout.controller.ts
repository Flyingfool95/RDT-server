import { Context } from "jsr:@oak/oak";
import { sendResponse } from "../../utils/helpers.ts";
import { logMessage } from "../../utils/logger.ts";
import { removeCookies } from "../../utils/cookies.ts";

export async function logout(ctx: Context): Promise<void> {
    removeCookies(ctx, [
        { name: "access_token", path: "/" },
        { name: "refresh_token", path: "/api/v1/auth/refresh-tokens" },
    ]);
    await logMessage("info", "User logged out");
    sendResponse(ctx, 200, null, "Logged out");
}
