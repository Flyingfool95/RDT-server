import { Router } from "jsr:@oak/oak";
import { rateLimiter } from "../../middlewares/ratelimit.middleware.ts";
import { update } from "./controllers/update.controller.ts";
import { jwtChecker } from "../../middlewares/jwt.middleware.ts";

const profileRoutes = new Router();

profileRoutes.patch("/update", rateLimiter, jwtChecker, update);

export default profileRoutes;
