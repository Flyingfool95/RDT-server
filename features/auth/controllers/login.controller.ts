import { Context } from "jsr:@oak/oak";
import { verify } from "jsr:@felix/argon2";
import { getIfExists, getSecureBody, sendResponse } from "../../utils/helpers/helpers.ts";
import { loginSchema } from "../../../zod/auth.ts";
import { HttpError } from "../../utils/classes/classes.ts";
import { generateJWT } from "../../utils/jwt/jwt.ts";
import { logMessage } from "../../utils/logger/logger.ts";
import { setCookie } from "../../utils/cookies/cookies.ts";

export async function login(ctx: Context): Promise<void> {
    const body = await getSecureBody(ctx, loginSchema);

    const userData = getIfExists("user", "email", body.data.email);
    if (!userData) {
        throw new HttpError(401, "Unauthorized", ["Incorrect credentials"]);
    }

    const isMatch = await verify(userData.password as string, body.data.password);
    if (!isMatch) {
        throw new HttpError(401, "Unauthorized", ["Incorrect credentials"]);
    }

    const payload = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
    };

    const refreshToken = await generateJWT(payload, parseInt(Deno.env.get("REFRESH_TOKEN_EXP") ?? "432000"));
    const accessToken = await generateJWT(payload, parseInt(Deno.env.get("ACCESS_TOKEN_EXP") ?? "900"));
    setCookie(ctx, "refresh_token", refreshToken, {
        path: "/api/v1/auth/refresh-tokens",
        maxAge: parseInt(Deno.env.get("REFRESH_TOKEN_EXP") ?? "432000"),
        httpOnly: true,
    });
    setCookie(ctx, "access_token", accessToken, {
        maxAge: parseInt(Deno.env.get("ACCESS_TOKEN_EXP") ?? "900"),
        httpOnly: true,
    });

    await logMessage("info", "User logged in", { userId: userData.id as string, clientIp: ctx.request.ip });
    sendResponse(ctx, 200, {
        message: "Logged in",
        data: {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            image: userData.image,
        },
    });
}
