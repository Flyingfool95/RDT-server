import { Context } from "jsr:@oak/oak";
import { sendResponse } from "../../utils/helpers.ts";

export function authCheck(ctx: Context) {
    sendResponse(ctx, 200, {
        id: ctx.state.payload.id,
        email: ctx.state.payload.email,
        name: ctx.state.payload.name,
        image: ctx.state.payload.image,
    });
}
