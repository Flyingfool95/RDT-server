import { Context } from "jsr:@oak/oak";
import { ZodType, ZodError } from "https://deno.land/x/zod@v3.23.8/mod.ts";

export function sendResponse(ctx: Context, status: number, data: unknown = null, errors: string[] | null = null) {
    ctx.response.status = status;
    ctx.response.body = {
        success: status >= 200 && status < 300,
        data: data ?? null,
        errors: errors && errors.length ? errors : null,
    };
}

export function sanitizeData(data: unknown) {}

export function validateData<T>(zodSchema: ZodType<T>, data: unknown) {
    try {
        return zodSchema.parse(data);
    } catch (error) {
        if (error instanceof ZodError) {
            //throw error
            console.error(error.errors);
            throw new Error(error.errors.map((err) => err.message).join(" and "));
        } else {
            //throw error
            console.error("Unknown error", error);
        }
    }
}
