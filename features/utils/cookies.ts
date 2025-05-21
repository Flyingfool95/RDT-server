import { Context } from "jsr:@oak/oak";

export function setCookie(ctx: Context, name: string, value: string, options: { maxAge?: number; secure?: boolean }) {
    ctx.cookies.set(name, value, {
        httpOnly: true,
        secure: options.secure ?? Deno.env.get("DENO_ENV") === "production",
        sameSite: "strict",
        path: "/",
        maxAge: options.maxAge ? options.maxAge : undefined,
    });
}

export function removeCookies(ctx: Context, cookies: string[]) {
    cookies.forEach((cookie) => {
        ctx.cookies.delete(cookie);
    });
}
