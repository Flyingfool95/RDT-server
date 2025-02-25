import { Router } from "jsr:@oak/oak";
import authRoutes from "../features/auth/AuthRoutes.ts";

const router = new Router();

router.prefix("/api/v1");

router.use("/auth", authRoutes.routes());

export default router;
