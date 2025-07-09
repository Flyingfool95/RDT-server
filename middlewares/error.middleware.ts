import { Context, Next } from "jsr:@oak/oak";
import { HttpError } from "../features/utils/classes/classes.ts";
import { sendResponse } from "../features/utils/helpers/helpers.ts";
import { SqliteError } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { ZodError } from "https://deno.land/x/zod@v3.24.2/mod.ts";
import { logMessage } from "../features/utils/logger/logger.ts";

export async function errorHandler(ctx: Context, next: Next) {
    try {
        await next();
    } catch (error: unknown) {
        let message = "Error";
        let errors: string[] = [];

        if (error instanceof HttpError) {
            message = "Error(1)";
            errors = error.errors ?? [];
            sendResponse(ctx, error.status, null, message, errors);
        } else if (error instanceof SqliteError) {
            message = "Error(2)";
            errors = [(error as Error).message];
            logMessage("error", `${message} - ${errors.join(", ")}`);
            sendResponse(ctx, 400, null, message, errors);
        } else if (error instanceof ZodError) {
            message = "Error(3)";
            errors = error.issues.map((err) => err.message);
            sendResponse(ctx, 400, null, message, errors);
        } else if (error instanceof Error) {
            message = "Error(4)";
            errors = [error.message];
            logMessage("error", `${message} - ${errors.join(", ")}`);
            sendResponse(ctx, 500, null, null, errors);
        } else {
            logMessage("error", `${message} - ${errors.join(", ")}`);
            sendResponse(ctx, 500, null, message, ["An unknown error occurred."]);
        }
    }
}
