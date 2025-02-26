import { Context, Next } from "jsr:@oak/oak";
import { HttpError } from "../features/utils/classes.ts";
import { sendResponse } from "../features/utils/helpers.ts";

export async function errorHandler(ctx: Context, next: Next) {
    try {
        await next();
    } catch (error) {
        console.error(error);

        if (error instanceof HttpError) {
            sendResponse(ctx, error.status, null, error.errors);
        } else {
            sendResponse(ctx, 500, null, [(error as Error).message]);
        }
    }
}
