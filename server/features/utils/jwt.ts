import { Algorithm } from "https://deno.land/x/djwt@v3.0.2/algorithm.ts";
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { HttpError } from "./classes.ts";

const key = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-512" }, true, ["sign", "verify"]);

export async function generateJWT(payload: Record<string, unknown>, expiresIn: number = 3600): Promise<string> {
    const header = { alg: "HS512" as Algorithm, typ: "JWT" };
    const fullPayload = { ...payload, exp: getNumericDate(expiresIn) };
    return await create(header, fullPayload, key);
}

export async function validateJWT(token: string): Promise<Record<string, unknown>> {
    try {
        return await verify(token, key);
    } catch (error) {
        console.log(error);
        throw new HttpError(401, "Validation failed", ["Invalid or expired JWT"]);
    }
}
