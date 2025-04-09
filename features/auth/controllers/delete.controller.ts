import { Context } from "jsr:@oak/oak";
import { getUserIfExists, sendResponse, deleteJWTTokens } from "../../utils/helpers.ts";
import { HttpError } from "../../utils/classes.ts";
import { verifyAccessToken } from "../../utils/helpers.ts";
import { logMessage } from "../../utils/logger.ts";
import db from "../../../db/db.ts";

export async function deleteUser(ctx: Context): Promise<void> {
    const verifiedAccessToken = await verifyAccessToken(ctx);
    const userData = getUserIfExists("id", verifiedAccessToken.id);
    if (!userData) throw new HttpError(401, "Unauthorized", ["User not found"]);

    db.query(`DELETE FROM users WHERE id = ?`, [verifiedAccessToken.id]);
    deleteJWTTokens(ctx);
    await logMessage("info", "User deleted", verifiedAccessToken.id);
    sendResponse(ctx, 200, null, "User deleted");
}
