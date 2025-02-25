import { Context, Next } from "jsr:@oak/oak";
import { HttpError } from "../features/shared/classes.ts";
import { sendResponse } from "../features/shared/helpers.ts";

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
