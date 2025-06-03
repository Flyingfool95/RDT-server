import { Context } from "jsr:@oak/oak";
import { getIfExists, sendResponse } from "../../utils/helpers.ts";
import { removeCookies, setCookie } from "../../utils/cookies.ts";
import { HttpError } from "../../utils/classes.ts";
import { generateJWT, verifyJWT } from "../../utils/jwt.ts";

export async function refreshTokens(ctx: Context) {
    const REFRESH_TOKEN_EXP = 432000;
    const ACCESS_TOKEN_EXP = 900;

    const currentTime = Math.floor(Date.now() / 1000);
    const refreshToken = await ctx.cookies.get("refresh_token");

    if (!refreshToken) {
        removeCookies(ctx, [
            { name: "access_token", path: "/" },
            { name: "refresh_token", path: "/api/v1/auth/refresh-tokens" },
        ]);
        throw new HttpError(401, "Unauthorized", ["No refresh token found"]);
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

    const newRefreshToken = await generateJWT(payload, REFRESH_TOKEN_EXP);
    const newAccessToken = await generateJWT(payload, ACCESS_TOKEN_EXP);

    setCookie(ctx, "refresh_token", newRefreshToken, {
        path: "/api/v1/auth/refresh-tokens",
        maxAge: REFRESH_TOKEN_EXP,
        httpOnly: true,
    });
    setCookie(ctx, "access_token", newAccessToken, { maxAge: ACCESS_TOKEN_EXP, httpOnly: true });

    // Optionally blacklist the old refresh token here

    sendResponse(ctx, 200, {
        user: {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            image: userData.image,
        },
    });
}
