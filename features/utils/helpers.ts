import { Context } from "jsr:@oak/oak";
import { ZodError, ZodSchema } from "https://deno.land/x/zod@v3.24.2/mod.ts";
import xss from "npm:xss";
import { HttpError } from "./classes.ts";
import { verifyJWT } from "./jwt.ts";
import db from "../../db/db.ts";

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

export function validateData<T>(zodSchema: ZodSchema, data: unknown): T {
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

export function generateSalt(length: number): Uint8Array {
    const salt = new Uint8Array(length);
    crypto.getRandomValues(salt);
    return salt;
}

export function setCookie(ctx: Context, name: string, value: string, options: { maxAge?: number; secure?: boolean }) {
    ctx.cookies.set(name, value, {
        httpOnly: true,
        secure: options.secure ?? Deno.env.get("DENO_ENV") === "production",
        sameSite: "strict",
        path: "/",
        maxAge: options.maxAge ? options.maxAge : undefined,
    });
}

export function validateInputData(schema: ZodSchema, data: unknown) {
    const result = schema.safeParse(data);

    if (!result.success) {
        throw new Error(`${result.error.issues.map((err: any) => err.message).join(" and ")}`);
    }

    return result.data;
}

export async function verifyAccessToken(ctx: Context) {
    const accessToken = await ctx.cookies.get("access_token");
    if (!accessToken) throw new HttpError(401, "Unauthorized", ["Missing access token"]);

    const verifiedAccessToken = (await verifyJWT(accessToken)) as {
        id: string;
        email: string;
        name: string;
        role: string;
        exp: number;
    };

    if (!verifiedAccessToken) {
        ctx.cookies.delete("refresh_token");
        ctx.cookies.delete("access_token");

        throw new HttpError(401, "Expired token", ["Access token expired"]);
    }

    return verifiedAccessToken;
}

export function deleteJWTTokens(ctx: Context) {
    ctx.cookies.delete("refresh_token");
    ctx.cookies.delete("access_token");
}

export function getUserIfExists(field: string, value: string) {
    const query = `SELECT * FROM users WHERE ${field} = ?`;
    const results = db.query(query, [value]);

    if (!results || results.length === 0) return null;

    const userData = {
        id: results[0][0],
        email: results[0][1],
        name: results[0][2],
        role: results[0][4],
        password: results[0][5],
    };

    return userData;
}
