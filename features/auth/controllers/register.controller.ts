import db from "../../../db/db.ts";
import { Context } from "jsr:@oak/oak";
import { hash } from "jsr:@felix/argon2";
import { generateSalt, sendResponse, getSecureBody, getIfExists } from "../../utils/helpers.ts";
import { registerSchema } from "../../../zod/auth.ts";
import { HttpError } from "../../utils/classes.ts";
import { logMessage } from "../../utils/logger.ts";
import { TypeRegisterBody } from "../../utils/types.ts";

export async function register(ctx: Context): Promise<void> {
    const body = (await getSecureBody(ctx, registerSchema)) as TypeRegisterBody;
    const id = crypto.randomUUID();
    const salt = generateSalt(24);
    const hashedPassword = await hash(body.data.password, { salt });

    const userData = getIfExists("user", "email", body.data.email);
    if (userData) {
        throw new HttpError(401, "Unauthorized", ["User already exists"]);
    }

    db.query("INSERT INTO user (id, email, name, password, created_at, image) VALUES (?, ?, ?, ?, ?, ?)", [
        id,
        body.data.email,
        "",
        hashedPassword,
        new Date().toISOString(),
        "",
    ]);

    await logMessage("info", "User registered", id);
    sendResponse(ctx, 201, null, "User registered");
}
