import { Context } from "jsr:@oak/oak";
import { getUserIfExists } from "../features/utils/helpers.ts";
import { HttpError } from "../features/utils/classes.ts";
import { generateJWT, verifyJWT } from "../features/utils/jwt.ts";
import { removeCookies, setCookie } from "../features/utils/cookies.ts";

export async function jwtChecker(ctx: Context, next: any) {
    const REFRESH_TOKEN_EXP = 432000;
    const ACCESS_TOKEN_EXP = 900;

    const currentTime = Math.floor(Date.now() / 1000);
    const accessToken = await ctx.cookies.get("access_token");
    const refreshToken = await ctx.cookies.get("refresh_token");

    if (!refreshToken) {
        removeCookies(ctx, ["access_token", "refresh_token"]);
        throw new HttpError(401, "Unauthorized", ["No refresh token found"]);
    }

    const verifiedRefreshToken = (await verifyJWT(refreshToken)) as {
        id: string;
        email: string;
        name: string;
        exp: number;
    };

    if (!verifiedRefreshToken) {
        removeCookies(ctx, ["access_token", "refresh_token"]);
        throw new HttpError(401, "Unauthorized", ["Invalid tokens"]);
    }

    if (!accessToken && verifiedRefreshToken.exp < currentTime) {
        removeCookies(ctx, ["access_token", "refresh_token"]);
        throw new HttpError(401, "Unauthorized", ["Expired tokens"]);
    }

    const userData = getUserIfExists("id", verifiedRefreshToken.id);
    if (!userData) throw new HttpError(401, "Unauthorized", ["User not found"]);

    if (!accessToken) {
        //refresh tokens

        const payload = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
        };

        const newRefreshToken = await generateJWT(payload, REFRESH_TOKEN_EXP);
        const newAccessToken = await generateJWT(payload, ACCESS_TOKEN_EXP);

        setCookie(ctx, "refresh_token", newRefreshToken, { maxAge: REFRESH_TOKEN_EXP });
        setCookie(ctx, "access_token", newAccessToken, { maxAge: ACCESS_TOKEN_EXP });

        // Optionally blacklist the old refresh token here
    }

    ctx.state.payload = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        image: userData.image,
    };

    await next();
}
