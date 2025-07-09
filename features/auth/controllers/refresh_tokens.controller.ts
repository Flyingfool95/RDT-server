import { Context } from "jsr:@oak/oak";
import { getIfExists, sendResponse } from "../../utils/helpers/helpers.ts";
import { removeCookies, setCookie } from "../../utils/cookies/cookies.ts";
import { HttpError } from "../../utils/classes/classes.ts";
import { generateJWT, verifyJWT } from "../../utils/jwt/jwt.ts";
import db from "../../../db/db.ts";

export async function refreshTokens(ctx: Context) {

    const currentTime = Math.floor(Date.now() / 1000);
    const refreshToken = await ctx.cookies.get("refresh_token");

    if (!refreshToken) {
        removeCookies(ctx, [
            { name: "access_token", path: "/" },
            { name: "refresh_token", path: "/api/v1/auth/refresh-tokens" },
        ]);
        throw new HttpError(401, "Unauthorized", ["No refresh token found"]);
    }

    const isTokenBlacklisted = getIfExists("token_blacklist", "token", refreshToken);
    if (isTokenBlacklisted) {
        throw new HttpError(401, "Unauthorized", ["Invalid token"]);
    }

    const verifiedRefreshToken = (await verifyJWT(refreshToken)) as {
        id: string;
        email: string;
        name: string;
        exp: number;
    };

    if (!verifiedRefreshToken || verifiedRefreshToken.exp < currentTime) {
        removeCookies(ctx, [
            { name: "access_token", path: "/" },
            { name: "refresh_token", path: "/api/v1/auth/refresh-tokens" },
        ]);
        throw new HttpError(401, "Unauthorized", ["Invalid tokens"]);
    }

    const userData = getIfExists("user", "id", verifiedRefreshToken.id);
    if (!userData) throw new HttpError(401, "Unauthorized", ["User not found"]);

    const payload = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
    };

    const newRefreshToken = await generateJWT(payload, parseInt(Deno.env.get("REFRESH_TOKEN_EXP") ?? "432000"));
    const newAccessToken = await generateJWT(payload, parseInt(Deno.env.get("ACCESS_TOKEN_EXP") ?? "900"));

    setCookie(ctx, "refresh_token", newRefreshToken, {
        path: "/api/v1/auth/refresh-tokens",
        maxAge: parseInt(Deno.env.get("REFRESH_TOKEN_EXP") ?? "432000"),
        httpOnly: true,
    });
    setCookie(ctx, "access_token", newAccessToken, {
        maxAge: parseInt(Deno.env.get("ACCESS_TOKEN_EXP") ?? "900"),
        httpOnly: true,
    });

    db.query("INSERT INTO token_blacklist (id, token) VALUES (?, ?)", [crypto.randomUUID(), refreshToken]);

    sendResponse(ctx, 200, null);
}
