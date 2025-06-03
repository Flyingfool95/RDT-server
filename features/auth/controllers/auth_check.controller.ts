import { Context } from "jsr:@oak/oak";
import { sendResponse } from "../../utils/helpers.ts";

export function authCheck(ctx: Context) {
    sendResponse(ctx, 200, { user: ctx.state.user });
}
