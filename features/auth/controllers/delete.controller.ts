import { Context } from "jsr:@oak/oak";
import { getIfExists, sendResponse } from "../../utils/helpers/helpers.ts";
import { HttpError } from "../../utils/classes/classes.ts";
import { removeCookies } from "../../utils/cookies/cookies.ts";
import { logMessage } from "../../utils/logger/logger.ts";
import db from "../../../db/db.ts";

export async function deleteUser(ctx: Context): Promise<void> {
    const userData = getIfExists("user", "id", ctx.state.user.id);
    if (!userData) throw new HttpError(401, "Unauthorized", ["Unauthorized"]);

    db.query(`DELETE FROM user WHERE id = ?`, [ctx.state.user.id]);

    removeCookies(ctx, [
        { name: "access_token", path: "/" },
        { name: "refresh_token", path: "/api/v1/auth/refresh-tokens" },
    ]);
    await logMessage("info", "User deleted", { userId: ctx.state.user.id });
    sendResponse(ctx, 200, { message: "User deleted" });
}
