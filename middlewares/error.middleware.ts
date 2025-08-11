import { Context, Next } from "jsr:@oak/oak";
import { HttpError } from "../features/utils/classes/classes.ts";
import { sendResponse } from "../features/utils/helpers/helpers.ts";
import { SqliteError } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { ZodError } from "https://deno.land/x/zod@v3.24.2/mod.ts";
import { logMessage } from "../features/utils/logger/logger.ts";
import { ApiError } from "../features/utils/helpers/types.ts";

export async function errorHandler(ctx: Context, next: Next) {
    try {
        await next();
    } catch (error: unknown) {
        let errorType = "Error";
        let errors: Array<ApiError> = [];

        if (error instanceof HttpError) {
            errorType = "Http Error";
            errors = [{ message: `${error.errors?.join(", ")}`, path: errorType }];
            sendResponse(ctx, error.status, { message: error.message, errors });
        } else if (error instanceof SqliteError) {
            errorType = "DB Error";
            errors = [{ message: error.message }];
            logMessage("error", `${errorType} - ${error.message}`);
            sendResponse(ctx, 400, { errors: [{ message: `${errors.join(", ")}`, path: errorType }] });
        } else if (error instanceof ZodError) {
            errorType = "Validation Error";
            errors = error.issues.map((err) => {
                return { message: err.message, path: err.path.join(", ") };
            });
            sendResponse(ctx, 400, { errors });
        } else if (error instanceof Error) {
            errorType = "Error";
            errors = [{ message: error.message }];
            logMessage("error", `${errorType} - ${error.message}`);
            sendResponse(ctx, 500, { errors: [{ message: `${errors.join(", ")}`, path: errorType }] });
        } else {
            logMessage("error", `${errorType} - ${errors.join(", ")}`);
            sendResponse(ctx, 500, { errors: [{ message: `${errors.join(", ")}`, path: errorType }] });
        }
    }
}
