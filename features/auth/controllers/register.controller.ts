import db from "../../../db/db.ts";
import { Context } from "jsr:@oak/oak";
import { hash } from "jsr:@felix/argon2";
import { getUserIfExists, generateSalt, sanitizeStrings, sendResponse } from "../../utils/helpers.ts";
import { registerSchema } from "../../../zod/auth.ts";
import { HttpError } from "../../utils/classes.ts";
import { logMessage } from "../../utils/logger.ts";

export async function register(ctx: Context): Promise<void> {
    const body = await ctx.request.body.json();
    const verifiedBody = registerSchema.parse(body);
    const sanitizedBody = sanitizeStrings(verifiedBody) as {
        email: string;
        password: string;
        confirmPassword: string;
    };

    const id = crypto.randomUUID();
    const salt = generateSalt(24);
    const hashedPassword = await hash(sanitizedBody.password, { salt });

    const userData = getUserIfExists("email", sanitizedBody.email);
    if (userData) {
        throw new HttpError(401, "Unauthorized", ["User already exists"]);
    }

    db.query("INSERT INTO user (id, email, name, password, created_at, image) VALUES (?, ?, ?, ?, ?, ?)", [
        id,
        sanitizedBody.email,
        "",
        hashedPassword,
        new Date().toISOString(),
        ""
    ]);

    await logMessage("info", "User registered", id);
    sendResponse(ctx, 201, null, "User registered");
}
