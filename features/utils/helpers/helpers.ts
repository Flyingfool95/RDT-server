import db from "../../../db/db.ts";
import xss from "npm:xss";
import { Context } from "jsr:@oak/oak";
import { ZodSchema } from "https://deno.land/x/zod@v3.24.2/mod.ts";
import { resize } from "https://deno.land/x/deno_image@0.0.4/mod.ts";
import { ApiError, ApiResponse, SanitizeInput } from "./types.ts";

export function sendResponse<T>(
    ctx: Context,
    status: number,
    {
        message,
        data,
        errors,
    }: {
        message?: string;
        data?: T;
        errors?: ApiError[];
    } = {}
) {
    ctx.response.status = status;
    const success = status >= 200 && status < 300;

    const response: ApiResponse<T> = {
        success,
        status,
        message,
        data,
        errors,
    };

    ctx.response.body = response;
}

export function sanitizeStrings<T extends SanitizeInput>(data: T): T {
    if (typeof data === "string") {
        return xss(data) as T;
    }

    if (Array.isArray(data)) {
        return data.map((item) => sanitizeStrings(item)) as T;
    }

    if (data && typeof data === "object") {
        const sanitizedObject: { [key: string]: SanitizeInput } = {};
        for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
                sanitizedObject[key] = sanitizeStrings((data as { [key: string]: SanitizeInput })[key]);
            }
        }
        return sanitizedObject as T;
    }

    return data;
}

export function generateSalt(length: number): Uint8Array {
    const salt = new Uint8Array(length);
    crypto.getRandomValues(salt);
    return salt;
}

const columnCache = new Map<string, string[]>();

export function getIfExists(table: string, field: string, value: string): Record<string, unknown> | null {
    const isValidIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!isValidIdentifier.test(table) || !isValidIdentifier.test(field)) {
        throw new Error("Invalid table or field name.");
    }

    const query = `SELECT * FROM ${table} WHERE ${field} = ? LIMIT 1`;
    const result = db.query(query, [value]);

    if (!result || result.length === 0) return null;

    let columnNames = columnCache.get(table);
    if (!columnNames) {
        columnNames = db.query(`PRAGMA table_info(${table})`).map((col: any[]) => col[1]);
        columnCache.set(table, columnNames);
    }

    const row = result[0];
    const record: Record<string, unknown> = {};

    columnNames.forEach((col, i) => {
        record[col] = row[i];
    });

    return record;
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
