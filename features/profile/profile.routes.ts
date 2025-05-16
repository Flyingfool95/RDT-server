import { Router } from "jsr:@oak/oak";
import { rateLimiter } from "../../middlewares/ratelimit.middleware.ts";
import { update } from "./controllers/update.controller.ts";
import { updateImage } from "./controllers/update_image.controller.ts";
import { jwtChecker } from "../../middlewares/jwt.middleware.ts";

const profileRoutes = new Router();

profileRoutes.patch("/update-image", rateLimiter, jwtChecker, updateImage);
profileRoutes.put("/update", rateLimiter, jwtChecker, update);

export default profileRoutes;
