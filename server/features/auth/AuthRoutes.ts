import { Context, Router } from "jsr:@oak/oak";

const authRoutes = new Router();

authRoutes.get("/hello", (ctx: Context) => {
    ctx.response.body = { message: "Hello!" };
});

export default authRoutes;
