import { Context } from "jsr:@oak/oak";
import { deleteJWTTokens, sendResponse } from "../../utils/helpers.ts";
import { logMessage } from "../../utils/logger.ts";

export async function logout(ctx: Context): Promise<void> {
    deleteJWTTokens(ctx);
    await logMessage("info", "User logged out");
    sendResponse(ctx, 200, null, "Logged out");
}
