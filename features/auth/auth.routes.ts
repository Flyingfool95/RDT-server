import { Router } from "jsr:@oak/oak";
import { rateLimiter } from "../../middlewares/ratelimit.middleware.ts";
import { register } from "./controllers/register.controller.ts";
import { login } from "./controllers/login.controller.ts";
import { logout } from "./controllers/logout.controller.ts";
import { deleteUser } from "./controllers/delete.controller.ts";
import { authCheck } from "./controllers/auth_check.controller.ts";
import { resetPassword } from "./controllers/reset_password.controller.ts";
import { sendResetEmail } from "./controllers/send_reset_email.controller.ts";

const authRoutes = new Router();

authRoutes.post("/register", rateLimiter, register);
authRoutes.post("/login", rateLimiter, login);
authRoutes.post("/reset-password", rateLimiter, resetPassword);
authRoutes.post("/send-reset-email", rateLimiter, sendResetEmail);

authRoutes.get("/auth-check", authCheck);

authRoutes.delete("/delete", deleteUser);
authRoutes.get("/logout", logout);

export default authRoutes;
