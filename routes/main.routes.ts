import { Router } from "jsr:@oak/oak";
import authRoutes from "../features/auth/auth.routes.ts";
import profileRoutes from "../features/profile/profile.routes.ts";

const router = new Router();

router.prefix("/api/v1");

router.use("/auth", authRoutes.routes());
router.use("/profile", profileRoutes.routes());

export default router;
