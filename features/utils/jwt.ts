import { Algorithm } from "https://deno.land/x/djwt@v3.0.2/algorithm.ts";
import { create, verify, decode, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { HttpError } from "./classes.ts";
import { Context } from "jsr:@oak/oak";

const secret = Deno.env.get("JWT_SECRET");
if (!secret) {
    throw new Error("JWT_SECRET is not set in environment variables.");
}
const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    true,
    ["sign", "verify"]
);

export async function generateJWT(payload: Record<string, unknown>, expiresIn: number = 3600): Promise<string> {
    const header = { alg: "HS512" as Algorithm, typ: "JWT" };
    const exp = expiresIn === 0 ? Math.floor(Date.now() / 1000) - 10 : getNumericDate(expiresIn);
    const fullPayload = { ...payload, exp };
    return await create(header, fullPayload, key);
}

export async function verifyJWT(token: string): Promise<Record<string, unknown> | null> {
    try {
        return await verify(token, key);
    } catch (error: unknown) {
        console.log(error);
        return null;
    }
}

export function decodeJWT(token: string) {
    const tokenParts = decode(token);

    return {
        headers: tokenParts[0],
        payload: tokenParts[1],
        signature: tokenParts[2],
    };
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

        throw new HttpError(401, "Unauthorized", ["Access token expired"]);
    }

    return verifiedAccessToken;
}
