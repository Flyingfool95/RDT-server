import db from "../../../db/db.ts";
import { Context } from "jsr:@oak/oak";
import { hash } from "jsr:@felix/argon2";
import { sendResponse, getSecureBody, getIfExists } from "../../utils/helpers/helpers.ts";
import { resetPasswordSchema } from "../../../zod/auth.ts";
import { HttpError } from "../../utils/classes/classes.ts";
import { verifyJWT } from "../../utils/jwt/jwt.ts";
import { generateSalt } from "../../utils/helpers/helpers.ts";
import { logMessage } from "../../utils/logger/logger.ts";
import { TypeResetPasswordBody } from "../../utils/types.ts";

export async function resetPassword(ctx: Context): Promise<void> {
    const body = (await getSecureBody(ctx, resetPasswordSchema)) as TypeResetPasswordBody;
    const isTokenBlacklisted = getIfExists("token_blacklist", "token", body.data.token);
    if (isTokenBlacklisted) {
        throw new HttpError(401, "Unauthorized", ["Invalid token"]);
    }

    const verifiedRefreshToken = (await verifyJWT(body.data.token)) as { email: string };
    if (!verifiedRefreshToken) {
        await logMessage("info", "Token expired");
        throw new HttpError(401, "Unauthorized", ["Token expired"]);
    }

    const userData = getIfExists("user", "email", verifiedRefreshToken.email);
    if (!userData) throw new HttpError(401, "Unauthorized", ["User not found"]);

    const salt = generateSalt(24);
    const hashedPassword = await hash(body.data.password, { salt });

    db.query(`UPDATE user SET password = ? WHERE email = ?`, [hashedPassword, verifiedRefreshToken.email]);

    db.query("INSERT INTO token_blacklist (id, token) VALUES (?, ?)", [crypto.randomUUID(), body.data.token]);

    await logMessage("info", "User set new password", verifiedRefreshToken.email);
    sendResponse(ctx, 200, null, "New password created");
}
