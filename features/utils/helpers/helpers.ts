import db from "../../../db/db.ts";
import xss from "npm:xss";
import { Context } from "jsr:@oak/oak";
import { ZodSchema } from "https://deno.land/x/zod@v3.24.2/mod.ts";
import { HttpError } from "../classes/classes.ts";
import { resize } from "https://deno.land/x/deno_image@0.0.4/mod.ts";

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

export function generateSalt(length: number): Uint8Array {
    const salt = new Uint8Array(length);
    crypto.getRandomValues(salt);
    return salt;
}

export function getIfExists(table: string, field: string, value: string) {
    const query = `SELECT * FROM ${table} WHERE ${field} = ?`;

    const results = db.query(query, [value]);

    if (!results || results.length === 0) return null;

    const columnNames = db.query(`PRAGMA table_info(${table})`).map((col: any[]) => col[1]);

    const objectResults: Record<string, unknown> = {};

    columnNames.forEach((name, i) => {
        objectResults[name] = results[0][i];
    });

    return objectResults;
}

export async function getSecureBody(ctx: Context, schema: ZodSchema) {
    const contentType = ctx.request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        const body = await ctx.request.body.json();
        const verifiedBody = schema.parse(body);
        const sanitizedBody = sanitizeStrings(verifiedBody);
        return { data: sanitizedBody, files: {} };
    }

    if (contentType.includes("multipart/form-data")) {
        const formData = await ctx.request.body.formData();

        const formObject: Record<string, unknown> = {};
        const files: Record<string, File[]> = {};

        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                if (!files[key]) files[key] = [];
                files[key].push(value);
            } else {
                formObject[kebabToCamel(key)] = value;
            }
        }

        const verifiedBody = schema.parse(formObject);
        const sanitizedBody = sanitizeStrings(verifiedBody);

        return {
            data: sanitizedBody,
            files,
        };
    }

    throw new Error("Unsupported Content-Type: " + contentType);
}

export function kebabToCamel(str: string) {
    return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export async function optimizeImage(file: File | Blob) {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const optimizedFile = await resize(buffer, {
        width: 128,
        height: 128,
    });

    return optimizedFile;
}
