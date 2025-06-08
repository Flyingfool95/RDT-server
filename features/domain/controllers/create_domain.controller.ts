import db from "../../../db/db.ts";
import { Context } from "jsr:@oak/oak";
import { getIfExists, sendResponse, optimizeImage } from "../../utils/helpers.ts";
import { HttpError } from "../../utils/classes.ts";

export async function createDomain(ctx: Context) {
    //check if domain id already exists
    //check how many domains this user has
    //optimize image
    //create domain in db

    const user = getIfExists("user", "id", ctx.state.user.id) as any;
    if (!user) throw new HttpError(401, "Unauthorized", ["User not found"]);

    console.log(user);

    //

    const contentType = ctx.request.headers.get("content-type") || "";
    if (!/^image\//.test(contentType)) {
        throw new HttpError(415, "Unsupported Media Type");
    }

    const imageBlob = await ctx.request.body.blob();

    if (!imageBlob) throw new HttpError(400, "Image file not provided");

    const image = await optimizeImage(imageBlob);

    console.log(image);

    sendResponse(ctx, 200, null, "Domain created");
}
