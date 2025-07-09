import { Context, Next } from "jsr:@oak/oak";
import { HttpError } from "../features/utils/classes/classes.ts";
import { verifyJWT } from "../features/utils/jwt/jwt.ts";
import { removeCookies } from "../features/utils/cookies/cookies.ts";
import { getIfExists } from "../features/utils/helpers/helpers.ts";

export async function jwtChecker(ctx: Context, next: Next) {
    const accessToken = await ctx.cookies.get("access_token");

    if (!accessToken) {
        removeCookies(ctx, [{ name: "access_token", path: "/" }]);
        throw new HttpError(401, "Unauthorized", ["Invalid access token"]);
    }
    const verifiedAccessToken = (await verifyJWT(accessToken)) as {
        id: string;
        email: string;
        name: string;
        exp: number;
    };

    const userData = getIfExists("user", "id", verifiedAccessToken.id);
    if (!userData) throw new HttpError(401, "Unauthorized", ["User not found"]);

    ctx.state.user = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        image: userData.image,
    };

    await next();
}
