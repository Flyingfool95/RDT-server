import db from "../../../db/db.ts";
import { Context } from "jsr:@oak/oak";
import { hash, verify } from "jsr:@felix/argon2";
import { HttpError } from "../../utils/classes.ts";
import { getUserIfExists, sendResponse, getSecureBody } from "../../utils/helpers.ts";
import { updateUserSchema } from "../../../zod/auth.ts";
import { generateSalt } from "../../utils/helpers.ts";
import { logMessage } from "../../utils/logger.ts";

export async function update(ctx: Context): Promise<void> {
    const currentUser = getUserIfExists("id", ctx.state.payload.id);
    if (!currentUser) {
        throw new HttpError(401, "Unauthorized", ["User not found"]);
    }

    const body = (await getSecureBody(ctx, updateUserSchema)) as {
        email: string;
        name: string;
        newPassword: string;
        currentPassword: string;
    };

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (body.newPassword) {
        if (!body.currentPassword) {
            throw new HttpError(400, "Bad Request", ["Current password required"]);
        }
        const passwordValid = await verify(currentUser.password as string, body.currentPassword);
        if (!passwordValid) {
            throw new HttpError(401, "Unauthorized", ["Incorrect current password"]);
        }
        updateFields.push("password = ?");
        const salt = generateSalt(24);
        const hashedPassword = await hash(body.newPassword, { salt });
        updateValues.push(hashedPassword);
    }

    if (body.email) {
        updateFields.push("email = ?");
        updateValues.push(body.email);
    }

    if (body.name) {
        updateFields.push("name = ?");
        updateValues.push(body.name);
    }

    if (updateFields.length === 0) {
        throw new HttpError(400, "Bad Request", ["Please fill in fields that you want to update"]);
    }

    const query = `UPDATE user SET ${updateFields.join(", ")} WHERE id = ?`;
    updateValues.push(ctx.state.payload.id);
    db.query(query, updateValues);

    const updatedUser = getUserIfExists("id", ctx.state.payload.id);
    if (!updatedUser) throw new HttpError(401, "Unauthorized", ["User not found"]);

    const safeUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.image,
    };

    await logMessage("info", "User profile updated", updatedUser.id as string);
    sendResponse(ctx, 200, safeUser, "User updated");
}
