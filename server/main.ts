import { Application, Router } from "jsr:@oak/oak";
import { corsMiddleware } from "./middlewares/cors.middleware.ts";

const app = new Application();
const router = new Router();

app.use(corsMiddleware);
router.get("/api", (ctx) => {
    ctx.response.body = "Hello World!";
});

await app.listen({ port: 8000 });
