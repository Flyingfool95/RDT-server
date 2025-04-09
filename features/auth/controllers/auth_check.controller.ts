import { Context } from "jsr:@oak/oak";
import { sendResponse, deleteJWTTokens, setCookie, getUserIfExists } from "../../utils/helpers.ts";
import { verifyJWT, generateJWT } from "../../utils/jwt.ts";
import { HttpError } from "../../utils/classes.ts";

const REFRESH_TOKEN_EXP = 432000;
const ACCESS_TOKEN_EXP = 900;

export async function authCheck(ctx: Context): Promise<void> {
    const currentTime = Math.floor(Date.now() / 1000);
    const accessToken = await ctx.cookies.get("access_token");
    const refreshToken = await ctx.cookies.get("refresh_token");

    if (!refreshToken) {
        deleteJWTTokens(ctx);
        return sendResponse(ctx, 401, null, "Missing refresh token, please login...");
    }

    const verifiedRefreshToken = (await verifyJWT(refreshToken)) as {
        id: string;
        email: string;
        name: string;
        role: string;
        exp: number;
    };

    if (!verifiedRefreshToken) {
        deleteJWTTokens(ctx);
        throw new HttpError(401, "Unauthorized", ["Refresh token expired"]);
    }

    const userData = getUserIfExists("id", verifiedRefreshToken.id);
    if (!userData) throw new HttpError(401, "Unauthorized", ["User not found"]);

    if (!accessToken && verifiedRefreshToken.exp > currentTime) {
        const payload = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
        };

        const newRefreshToken = await generateJWT(payload, REFRESH_TOKEN_EXP);
        const newAccessToken = await generateJWT(payload, ACCESS_TOKEN_EXP);

        setCookie(ctx, "refresh_token", newRefreshToken, { maxAge: REFRESH_TOKEN_EXP });
        setCookie(ctx, "access_token", newAccessToken, { maxAge: ACCESS_TOKEN_EXP });

        // Optionally blacklist the old refresh token here

        return sendResponse(ctx, 200, payload, "Token refreshed");
    }

    sendResponse(ctx, 200, {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
    });
}
