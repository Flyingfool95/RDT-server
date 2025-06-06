import { Context } from "jsr:@oak/oak";
import { verify } from "jsr:@felix/argon2";
import { getIfExists, getSecureBody, sendResponse } from "../../utils/helpers.ts";
import { loginSchema } from "../../../zod/auth.ts";
import { HttpError } from "../../utils/classes.ts";
import { generateJWT } from "../../utils/jwt.ts";
import { logMessage } from "../../utils/logger.ts";
import { setCookie } from "../../utils/cookies.ts";
import { TypeLoginBody } from "../../utils/types.ts";

const REFRESH_TOKEN_EXP = 432000;
const ACCESS_TOKEN_EXP = 900;

export async function login(ctx: Context): Promise<void> {
    const body = (await getSecureBody(ctx, loginSchema)) as TypeLoginBody;

    const userData = getIfExists("user", "email", body.data.email);
    if (!userData) {
        throw new HttpError(401, "Unauthorized", ["User not found"]);
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

    const refreshToken = await generateJWT(payload, REFRESH_TOKEN_EXP);
    const accessToken = await generateJWT(payload, ACCESS_TOKEN_EXP);
    setCookie(ctx, "refresh_token", refreshToken, {
        path: "/api/v1/auth/refresh-tokens",
        maxAge: REFRESH_TOKEN_EXP,
        httpOnly: true,
    });
    setCookie(ctx, "access_token", accessToken, { maxAge: ACCESS_TOKEN_EXP, httpOnly: true });

    await logMessage("info", "User logged in", userData.id as string);
    sendResponse(
        ctx,
        200,
        {
            user: {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                image: userData.image,
            },
        },
        "User logged in"
    );
}
