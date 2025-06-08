import { Router } from "jsr:@oak/oak";
import { rateLimiter } from "../../middlewares/ratelimit.middleware.ts";
import { jwtChecker } from "../../middlewares/jwt.middleware.ts";
import { createDomain } from "./controllers/create_domain.controller.ts";

const domainRoutes = new Router();

domainRoutes.post("/create", rateLimiter, jwtChecker, createDomain);

export default domainRoutes;
