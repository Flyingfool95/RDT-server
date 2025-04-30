import { Context } from "jsr:@oak/oak";
import { hash, verify } from "jsr:@felix/argon2";
import { getUserIfExists, sendResponse, sanitizeStrings } from "../../utils/helpers.ts";
import { updateUserSchema } from "../../../zod/auth.ts";
import { HttpError } from "../../utils/classes.ts";
import { generateSalt } from "../../utils/helpers.ts";
import { verifyAccessToken } from "../../utils/helpers.ts";
import { logMessage } from "../../utils/logger.ts";
import db from "../../../db/db.ts";

export async function update(ctx: Context): Promise<void> {
    const verifiedAccessToken = await verifyAccessToken(ctx);
    const currentUser = getUserIfExists("id", verifiedAccessToken.id);
    if (!currentUser) {
        throw new HttpError(401, "Unauthorized", ["User not found"]);
    }

    const body = await ctx.request.body.json();
    const verifiedBody = updateUserSchema.parse(body);
    const sanitizedBody = sanitizeStrings(verifiedBody) as {
        email: string;
        name: string;
        newPassword: string;
        currentPassword: string;
    };

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (sanitizedBody.newPassword) {
        if (!sanitizedBody.currentPassword) {
            throw new HttpError(400, "Bad Request", ["Current password required"]);
        }
        const passwordValid = await verify(currentUser.password as string, sanitizedBody.currentPassword);
        if (!passwordValid) {
            throw new HttpError(401, "Unauthorized", ["Incorrect current password"]);
        }
        updateFields.push("password = ?");
        const salt = generateSalt(24);
        const hashedPassword = await hash(sanitizedBody.newPassword, { salt });
        updateValues.push(hashedPassword);
    }

    if (sanitizedBody.email) {
        updateFields.push("email = ?");
        updateValues.push(sanitizedBody.email);
    }

    if (sanitizedBody.name) {
        updateFields.push("name = ?");
        updateValues.push(sanitizedBody.name);
    }

    if (updateFields.length === 0) {
        throw new HttpError(400, "Bad Request", ["Please fill in fields that you want to update"]);
    }

    const query = `UPDATE user SET ${updateFields.join(", ")} WHERE id = ?`;
    updateValues.push(verifiedAccessToken.id);
    db.query(query, updateValues);

    const updatedUser = getUserIfExists("id", verifiedAccessToken.id);
    if (!updatedUser) throw new HttpError(401, "Unauthorized", ["User not found"]);

    const safeUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.image
    };

    await logMessage("info", "User profile updated", updatedUser.id as string);
    sendResponse(ctx, 200, safeUser, "User updated");
}
