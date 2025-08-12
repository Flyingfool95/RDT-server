import { Context } from "jsr:@oak/oak";
import { sendResponse } from "../../utils/helpers/helpers.ts";

export function authCheck(ctx: Context) {
    sendResponse(ctx, 200, { data: { user: ctx.state.user } });
}
