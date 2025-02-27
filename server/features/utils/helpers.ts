import { Context } from "jsr:@oak/oak";
import { ZodType, ZodError } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import xss from "npm:xss";
import { HttpError } from "./classes.ts";

export function sendResponse(ctx: Context, status: number, data: unknown = null, errors: string[] | null = null) {
    ctx.response.status = status;
    ctx.response.body = {
        success: status >= 200 && status < 300,
        data: data ?? null,
        errors: errors && errors.length ? errors : null,
    };
}

export function sanitizeStrings(data: unknown): unknown {

    if (typeof data === "string") {
        return xss(data);
    }

    if (data && typeof data === "object") {
        const sanitizedObject: Record<string, unknown> = {};

        for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
                const value = (data as Record<string, unknown>)[key];

                sanitizedObject[key] = typeof value === "string" ? xss(value) : value;
            }
        }

        return sanitizedObject;
    }

    return data;
}

export function validateData<T>(zodSchema: ZodType<T>, data: unknown) {
    try {
        return zodSchema.parse(data);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new HttpError(
                400,
                "Validation error",
                error.errors.map((err) => err.message)
            );
        } else {
            throw new Error(error instanceof Error ? error.message : "Unknown error");
        }
    }
}
