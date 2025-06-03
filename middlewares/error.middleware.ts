import { Context, Next } from "jsr:@oak/oak";
import { HttpError } from "../features/utils/classes.ts";
import { sendResponse } from "../features/utils/helpers.ts";
import { SqliteError } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { logMessage } from "../features/utils/logger.ts";

export async function errorHandler(ctx: Context, next: Next) {
    try {
        await next();
    } catch (error: unknown) {
        let message = "Unknown error";
        let details: string[] = [];

        if (error instanceof HttpError) {
            message = "Http Error";
            details = error.errors ?? [];
            sendResponse(ctx, error.status, null, message, details);
        } else if (error instanceof SqliteError) {
            message = "SQL Error";
            details = [(error as Error).message];
            sendResponse(ctx, 400, null, message, details);
        } else if (error instanceof Error) {
            message = error.message;
            details = [error.message];
            sendResponse(ctx, 500, null, null, details);
        } else {
            sendResponse(ctx, 500, null, null, ["An unknown error occurred."]);
        }

        logMessage("error", `${message} - ${details.join(", ")}`);
    }
}
