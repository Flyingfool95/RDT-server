import db from "../../../db/db.ts";
import { Context } from "jsr:@oak/oak";
import { hash, verify } from "jsr:@felix/argon2";
import { HttpError } from "../../utils/classes/classes.ts";
import { sendResponse, getSecureBody, getIfExists, optimizeImage } from "../../utils/helpers/helpers.ts";
import { generateSalt } from "../../utils/helpers/helpers.ts";
import { logMessage } from "../../utils/logger/logger.ts";
import { ZodError } from "https://deno.land/x/zod@v3.24.2/mod.ts";
import { updateUserSchema } from "../../../zod/profile.ts";

export async function update(ctx: Context): Promise<void> {
    const userId = ctx.state.user.id;
    const currentUser = getIfExists("user", "id", userId);
    if (!currentUser) throw new HttpError(401, "Unauthorized", ["Unauthorized"]);

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
            throw ZodError.create([
                {
                    path: ["currentPassword"],
                    message: "Incorrect current password",
                    code: "custom",
                },
            ]);
        }

        const salt = generateSalt(24);
        const hashedPassword = await hash(body.data.newPassword, { salt });
        db.query(`UPDATE user SET password = ? WHERE id = ?`, [hashedPassword, userId]);
        updated = true;
    }

    if (body.data.email !== undefined && body.data.email !== currentUser.email) {
        db.query(`UPDATE user SET email = ? WHERE id = ?`, [body.data.email, userId]);
        updated = true;
    } else if (body.data.email === currentUser.email) {
        throw new HttpError(409, "Bad Request", ["Please fill in a new email"]);
    }

    if (body.data.name !== undefined && body.data.name !== currentUser.name) {
        db.query(`UPDATE user SET name = ? WHERE id = ?`, [body.data.name, userId]);
        updated = true;
    } else if (body.data.name === currentUser.name) {
        throw new HttpError(409, "Bad Request", ["Please fill in a new name"]);
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
    if (!updatedUser) throw new HttpError(404, "Unauthorized", ["Unauthorized"]);

    const safeUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.image,
    };

    await logMessage("info", "User profile updated", { userId });
    sendResponse(ctx, 200, { message: "Profile updated", data: safeUser });
}
