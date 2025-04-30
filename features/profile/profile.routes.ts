import { Router } from "jsr:@oak/oak";
import { rateLimiter } from "../../middlewares/ratelimit.middleware.ts";
import { update } from "./controllers/update.controller.ts";
import { updateImage } from "./controllers/update_image.controller.ts";

const profileRoutes = new Router();

profileRoutes.patch("/update-image", rateLimiter, updateImage);
profileRoutes.put("/update", rateLimiter, update);

export default profileRoutes;
