import { Context } from "jsr:@oak/oak";
import { sendResponse } from "../../utils/helpers/helpers.ts";
import { removeCookies } from "../../utils/cookies/cookies.ts";

export function logout(ctx: Context) {
    removeCookies(ctx, [
        { name: "access_token", path: "/" },
        { name: "refresh_token", path: "/api/v1/auth/refresh-tokens" },
    ]);
    sendResponse(ctx, 200, null, "Logged out");
}
