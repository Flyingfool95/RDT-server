import { ZodSchema } from "https://deno.land/x/zod@v3.24.2/mod.ts";
import { Context } from "jsr:@oak/oak";

export function validateInputData(schema: ZodSchema, data: unknown) {
    const result = schema.safeParse(data);

    if (!result.success) {
        throw new Error(`${result.error.issues.map((err: any) => err.message).join(" and ")}`);
    }

    return result.data;
}

export function setCookie(ctx: Context, name: string, value: string, options: { maxAge?: number; secure?: boolean }) {
    ctx.cookies.set(name, value, {
        httpOnly: true,
        secure: options.secure ?? Deno.env.get("DENO_ENV") === "production",
        sameSite: "strict",
        path: "/",
        maxAge: options.maxAge ? options.maxAge * 1000 : undefined,
    });
}
