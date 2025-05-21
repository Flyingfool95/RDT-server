import xss from "npm:xss";
import { Context } from "jsr:@oak/oak";
import { ZodSchema } from "https://deno.land/x/zod@v3.24.2/mod.ts";
import db from "../../db/db.ts";
import { HttpError } from "./classes.ts";

export function sendResponse(
    ctx: Context,
    status: number,
    data: unknown = null,
    message: string | null = null,
    errors: string[] | null = null
) {
    ctx.response.status = status;
    ctx.response.body = {
        success: status >= 200 && status < 300,
        data: data ?? null,
        message,
        errors: errors && errors.length ? errors : null,
    };
}

export function sanitizeStrings(data: unknown): unknown {
    if (typeof data === "string") {
        return xss(data);
    }

    if (Array.isArray(data)) {
        return data.map((item) => sanitizeStrings(item));
    }

    if (data && typeof data === "object") {
        const sanitizedObject: Record<string, unknown> = {};
        for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
                sanitizedObject[key] = sanitizeStrings((data as Record<string, unknown>)[key]);
            }
        }
        return sanitizedObject;
    }

    return data;
}

export function validateInputData(schema: ZodSchema, data: unknown) {
    const result = schema.safeParse(data);

    if (!result.success) {
        throw new HttpError(400, "Validation error");
    }

    return result.data;
}

export function generateSalt(length: number): Uint8Array {
    const salt = new Uint8Array(length);
    crypto.getRandomValues(salt);
    return salt;
}

export function getUserIfExists(field: string, value: string) {
    const query = `SELECT * FROM user WHERE ${field} = ?`;
    const results = db.query(query, [value]);

    if (!results || results.length === 0) return null;

    const userData = {
        id: results[0][0],
        name: results[0][1],
        email: results[0][2],
        password: results[0][3],
        createdAt: results[0][4],
        image: results[0][5],
    };

    return userData;
}

export async function getSecureBody(ctx: Context, schema: ZodSchema) {
    const body = await ctx.request.body.json();
    const verifiedBody = schema.parse(body);
    const sanitizedBody = sanitizeStrings(verifiedBody);

    return sanitizedBody;
}
