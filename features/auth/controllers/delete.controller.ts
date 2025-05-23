import { Context } from "jsr:@oak/oak";
import { getUserIfExists, sendResponse } from "../../utils/helpers.ts";
import { HttpError } from "../../utils/classes.ts";
import { removeCookies } from "../../utils/cookies.ts";
import { logMessage } from "../../utils/logger.ts";
import db from "../../../db/db.ts";

export async function deleteUser(ctx: Context): Promise<void> {
    const userData = getUserIfExists("id", ctx.state.payload.id);
    if (!userData) throw new HttpError(401, "Unauthorized", ["User not found"]);
    
    db.query(`DELETE FROM user WHERE id = ?`, [ctx.state.payload.id]);

    removeCookies(ctx, ["access_token", "refresh_token"]);

    await logMessage("info", "User deleted", ctx.state.payload.id);
    sendResponse(ctx, 200, null, "User deleted");
}
