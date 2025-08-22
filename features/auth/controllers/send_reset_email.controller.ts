import { Context } from "jsr:@oak/oak";
import { sendResponse, getSecureBody, getIfExists } from "../../utils/helpers/helpers.ts";
import { sendResetEmailSchema } from "../../../zod/auth.ts";
import { generateJWT } from "../../utils/jwt/jwt.ts";
import { sendMail } from "../../utils/smtp/SMTP.ts";
import { logMessage } from "../../utils/logger/logger.ts";
import { HttpError } from "../../utils/classes/classes.ts";

export async function sendResetEmail(ctx: Context): Promise<void> {
    const body = await getSecureBody(ctx, sendResetEmailSchema);

    const userData = getIfExists("user", "email", body.data.email);
    if (!userData) throw new HttpError(401, "Unauthorized", ["Unauthorized"]);
    const token = await generateJWT({ email: body.data.email }, 300);

    await sendMail(
        "contact@omebia.com",
        body.data.email,
        "RDT Reset Password Email",
        `Reset your password here: ${Deno.env.get("FRONTEND_URL")}/reset-password?token=${token}`,
        `<p>Reset your password <a href="${Deno.env.get("FRONTEND_URL")}/reset-password?token=${token}">here</a></p>`
    );

    await logMessage("info", "Sending reset email", { userId: body.data.email });
    sendResponse(ctx, 200, { message: "Email sent" });
}
