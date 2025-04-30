// deno-lint-ignore-file no-explicit-any

import { Context, Next } from "jsr:@oak/oak";
import { HttpError } from "../features/utils/classes.ts";
import { sendResponse } from "../features/utils/helpers.ts";
import { SqliteError } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { logMessage } from "../features/utils/logger.ts";

export async function errorHandler(ctx: Context, next: Next) {
    try {
        await next();
    } catch (error: any) {
        logMessage("error", `${error.message}: ${error.errors.join(", ") ?? "error"}`);

        if (error instanceof HttpError) {
            sendResponse(ctx, error.status, null, "Http Error", error.errors);
        } else if (error instanceof SqliteError) {
            sendResponse(ctx, 400, null, "SQL Error", [(error as Error).message]);
        } else {
            sendResponse(ctx, 500, null, null, [(error as Error).message]);
        }
    }
}
