import { Context } from "jsr:@oak/oak";
import { sendResponse, sanitizeStrings } from "../../utils/helpers.ts";
import { sendResetEmailSchema } from "../../../zod/auth.ts";
import { generateJWT } from "../../utils/jwt.ts";
import { sendMail } from "../../utils/SMTP.ts";
import { logMessage } from "../../utils/logger.ts";

export async function sendResetEmail(ctx: Context): Promise<void> {
    const body = await ctx.request.body.json();
    const verifiedBody = sendResetEmailSchema.parse(body);
    const sanitizedBody = sanitizeStrings({ email: verifiedBody }) as {
        email: string;
    };

    const token = await generateJWT({ email: sanitizedBody.email }, 300);

    await sendMail(
        "contact@omebia.com",
        sanitizedBody.email,
        "RDT Reset Password Email",
        `Reset your password here: ${Deno.env.get("FRONTEND_URL")}/reset-password?token=${token}`,
        `<p>Reset your password <a href="${Deno.env.get("FRONTEND_URL")}/reset-password?token=${token}">here</a></p>`
    );

    await logMessage("info", "Sending reset email", sanitizedBody.email);
    sendResponse(ctx, 200, null, "Reset email sent");
}
