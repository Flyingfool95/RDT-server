import { Context } from "jsr:@oak/oak";
import { getUserIfExists, sendResponse, verifyAccessToken } from "../../utils/helpers.ts";
import { HttpError } from "../../utils/classes.ts";
import { resize } from "https://deno.land/x/deno_image@0.0.4/mod.ts";
import db from "../../../db/db.ts";

export async function updateImage(ctx: Context) {
    const verifiedAccessToken = await verifyAccessToken(ctx);
    const user = getUserIfExists("id", verifiedAccessToken.id);
    if (!user) throw new HttpError(401, "Unauthorized", ["User not found"]);

    const contentType = ctx.request.headers.get("content-type") || "";
    if (!/^image\//.test(contentType)) {
        throw new HttpError(415, "Unsupported Media Type");
    }

    const imageBlob = await ctx.request.body.blob();

    if (!imageBlob) throw new HttpError(400, "Image file not provided");

    const buffer = new Uint8Array(await imageBlob.arrayBuffer());
    const optimizedFile = await resize(buffer, {
        width: 128,
        height: 128,
    });

    db.query("UPDATE user SET image = ? WHERE id = ?", [optimizedFile, user.id as string]);

    sendResponse(ctx, 200, null, "Image updated");
}
