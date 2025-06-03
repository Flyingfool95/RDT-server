import { Context } from "jsr:@oak/oak";
import { getIfExists, sendResponse } from "../../utils/helpers.ts";
import { HttpError } from "../../utils/classes.ts";
import { removeCookies } from "../../utils/cookies.ts";
import { logMessage } from "../../utils/logger.ts";
import db from "../../../db/db.ts";

export async function deleteUser(ctx: Context): Promise<void> {
    const userData = getIfExists("user", "id", ctx.state.user.id);
    if (!userData) throw new HttpError(401, "Unauthorized", ["User not found"]);

    db.query(`DELETE FROM user WHERE id = ?`, [ctx.state.user.id]);

    removeCookies(ctx, [
        { name: "access_token", path: "/" },
        { name: "refresh_token", path: "/api/v1/auth/refresh-tokens" },
    ]);
    await logMessage("info", "User deleted", ctx.state.user.id);
    sendResponse(ctx, 200, null, "User deleted");
}
