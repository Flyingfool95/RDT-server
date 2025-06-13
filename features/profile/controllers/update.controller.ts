import db from "../../../db/db.ts";
import { Context } from "jsr:@oak/oak";
import { hash, verify } from "jsr:@felix/argon2";
import { HttpError } from "../../utils/classes.ts";
import { sendResponse, getSecureBody, getIfExists, optimizeImage } from "../../utils/helpers.ts";
import { updateUserSchema } from "../../../zod/auth.ts";
import { generateSalt } from "../../utils/helpers.ts";
import { logMessage } from "../../utils/logger.ts";

export async function update(ctx: Context): Promise<void> {
    const userId = ctx.state.user.id;
    const currentUser = getIfExists("user", "id", userId);
    if (!currentUser) throw new HttpError(401, "Unauthorized", ["User not found"]);

    const body = (await getSecureBody(ctx, updateUserSchema)) as {
        data: {
            image?: File;
            email?: string;
            name?: string;
            newPassword?: string;
            currentPassword?: string;
        };
        files: {
            image?: File[];
        };
    };

    let updated = false;

    if (body.data.newPassword !== undefined) {
        if (!body.data.currentPassword) {
            throw new HttpError(400, "Bad Request", ["Current password required"]);
        }

        const isValid = await verify(currentUser.password as string, body.data.currentPassword);
        if (!isValid) {
            throw new HttpError(401, "Unauthorized", ["Incorrect current password"]);
        }

        const salt = generateSalt(24);
        const hashedPassword = await hash(body.data.newPassword, { salt });
        db.query(`UPDATE user SET password = ? WHERE id = ?`, [hashedPassword, userId]);
        updated = true;
    }

    if (body.data.email !== undefined && body.data.email !== currentUser.email) {
        db.query(`UPDATE user SET email = ? WHERE id = ?`, [body.data.email, userId]);
        updated = true;
    }

    if (body.data.name !== undefined && body.data.name !== currentUser.name) {
        db.query(`UPDATE user SET name = ? WHERE id = ?`, [body.data.name, userId]);
        updated = true;
    }

    if (body.files.image !== undefined) {
        const optimizedImage = await optimizeImage(body.files.image[0]);

        db.query(`UPDATE user SET image = ? WHERE id = ?`, [optimizedImage, userId]);
        updated = true;
    }

    if (!updated) {
        throw new HttpError(400, "Bad Request", ["No valid fields provided to update"]);
    }

    const updatedUser = getIfExists("user", "id", userId);
    if (!updatedUser) throw new HttpError(404, "Unauthorized", ["User not found"]);

    const safeUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.image,
    };

    await logMessage("info", "User profile updated", userId);
    sendResponse(ctx, 200, { user: safeUser }, "User updated successfully");
}
