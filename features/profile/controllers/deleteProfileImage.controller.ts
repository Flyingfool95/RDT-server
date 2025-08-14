import { Context } from "jsr:@oak/oak";
import { HttpError } from "../../utils/classes/classes.ts";
import { sendResponse, getSecureBody, getIfExists } from "../../utils/helpers/helpers.ts";
import { logMessage } from "../../utils/logger/logger.ts";
import { deleteProfileImageSchema } from "../../../zod/profile.ts";
import db from "../../../db/db.ts";

export async function deleteProfileImage(ctx: Context): Promise<void> {
    const userId = ctx.state.user.id;
    const currentUser = getIfExists("user", "id", userId);
    if (!currentUser) throw new HttpError(401, "Unauthorized", ["Unauthorized"]);
    const body = (await getSecureBody(ctx, deleteProfileImageSchema)) as {
        data: {
            image?: File | string;
            email?: string;
            name?: string;
            newPassword?: string;
            currentPassword?: string;
        };
        files: {
            image?: File[];
        };
    };

    db.query(`UPDATE user SET image = ? WHERE id = ?`, [body.data.image, userId]);

    const updatedUser = getIfExists("user", "id", userId);
    if (!updatedUser) throw new HttpError(404, "Unauthorized", ["Unauthorized"]);

    const safeUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.image,
    };

    await logMessage("info", "Profile image deleted", { userId });

    sendResponse(ctx, 200, { message: "Profile image deleted", data: safeUser });
}
