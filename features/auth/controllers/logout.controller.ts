import { Context } from "jsr:@oak/oak";
import { sendResponse } from "../../utils/helpers.ts";
import { logMessage } from "../../utils/logger.ts";
import { removeCookies } from "../../utils/cookies.ts";

export async function logout(ctx: Context): Promise<void> {
    removeCookies(ctx, ["access_token", "refresh_token"]);
    await logMessage("info", "User logged out");
    sendResponse(ctx, 200, null, "Logged out");
}
