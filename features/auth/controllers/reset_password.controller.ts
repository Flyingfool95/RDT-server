import { Context } from "jsr:@oak/oak";
import { hash } from "jsr:@felix/argon2";
import { sendResponse, sanitizeStrings } from "../../utils/helpers.ts";
import { resetPasswordSchema } from "../../../zod/auth.ts";
import { HttpError } from "../../utils/classes.ts";
import { verifyJWT } from "../../utils/jwt.ts";
import { generateSalt } from "../../utils/helpers.ts";
import db from "../../../db/db.ts";
import { logMessage } from "../../utils/logger.ts";
import { getUserIfExists } from "../../utils/helpers.ts";

export async function resetPassword(ctx: Context): Promise<void> {
    const body = await ctx.request.body.json();
    const verifiedBody = resetPasswordSchema.parse(body);
    const sanitizedBody = sanitizeStrings(verifiedBody) as { token: string; password: string };

    const verifiedRefreshToken = (await verifyJWT(sanitizedBody.token)) as { email: string };
    if (!verifiedRefreshToken) {
        await logMessage("info", "Token expired");
        throw new HttpError(401, "Unauthorized", ["Refresh token expired"]);
    }

    const userData = getUserIfExists("email", verifiedRefreshToken.email);
    if (!userData) throw new HttpError(401, "Unauthorized", ["User not found"]);

    const salt = generateSalt(24);
    const hashedPassword = await hash(sanitizedBody.password, { salt });

    db.query(`UPDATE users SET password = ? WHERE email = ?`, [hashedPassword, verifiedRefreshToken.email]);

    await logMessage("info", "User set new password", verifiedRefreshToken.email);
    sendResponse(ctx, 200, null, "New password created");
}
