import { Context } from "jsr:@oak/oak";
import { SetCookieOptions } from "../types.ts";

export function setCookie(ctx: Context, name: string, value: string, options: SetCookieOptions = {}) {
    const {
        sameSite = "strict",
        path = "/",
        maxAge,
        secure = Deno.env.get("DENO_ENV") === "production",
        httpOnly = false,
    } = options;

    ctx.cookies.set(name, value, {
        sameSite,
        path,
        maxAge,
        secure,
        httpOnly,
    });
}

export function removeCookies(ctx: Context, cookies: { name: string; path: string }[]) {
    cookies.forEach((cookie) => {
        ctx.cookies.delete(cookie.name, { path: cookie.path });
    });
}
