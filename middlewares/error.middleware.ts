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
        let status = 500;
        let message = "Internal Server Error";
        let errors: ApiError[] = [];

        if (error instanceof HttpError) {
            status = error.status;
            message = error.message;
            errors = error.errors?.map((err) => ({ message: err, path: "Http Error" })) || [];
        } else if (error instanceof SqliteError) {
            status = 400;
            message = "DB Error";
            errors = [{ message: error.message, path: "DB Error" }];
            logMessage("error", `${message} - ${error.message}`);
        } else if (error instanceof ZodError) {
            status = 400;
            message = "Validation Error";
            errors = error.issues.map((err) => ({ message: err.message, path: err.path.join(", ") }));
        } else if (error instanceof Error) {
            message = error.message;
            errors = [{ message, path: "Error" }];
            logMessage("error", `${message}`);
        } else {
            errors = [{ message: "Unknown error", path: "Error" }];
            logMessage("error", "Unknown error occurred");
        }

        sendResponse(ctx, status, { message, errors });
    }
}
