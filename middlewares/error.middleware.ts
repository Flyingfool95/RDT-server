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
        let errors: Array<string> | Array<{ message: string; path: string }> = [];

        if (error instanceof HttpError) {
            message = "Http Error";
            errors = error.errors ?? [];
            sendResponse(ctx, error.status, null, [{ message: `${message}: ${errors.join(", ")}`, path: "" }]);
        } else if (error instanceof SqliteError) {
            message = "DB Error";
            errors = [(error as Error).message];
            logMessage("error", `${message} - ${errors.join(", ")}`);
            sendResponse(ctx, 400, null, [{ message: `${message}: ${errors.join(", ")}`, path: "" }]);
        } else if (error instanceof ZodError) {
            message = "Validation Error";
            errors = error.issues.map((err) => {
                return { message: err.message, path: err.path.join(", ") };
            });

            console.log(errors);
            sendResponse(ctx, 400, null, errors);
        } else if (error instanceof Error) {
            message = "Error";
            errors = [error.message];
            logMessage("error", `${message} - ${errors.join(", ")}`);
            sendResponse(ctx, 500, null, [{ message: `${message}: ${errors.join(", ")}`, path: "" }]);
        } else {
            logMessage("error", `${message} - ${errors.join(", ")}`);
            sendResponse(ctx, 500, null, [{ message: `${message}: ${errors.join(", ")}`, path: "" }]);
        }
    }
}
