import { Context } from "jsr:@oak/oak";

export function sendResponse(
    ctx: Context,
    status: number,
    data: unknown = null,
    errors: string[] | null = null
) {
    ctx.response.status = status;
    ctx.response.body = {
        success: status >= 200 && status < 300, 
        data: data ?? null, 
        errors: errors && errors.length ? errors : null,
    };
}
