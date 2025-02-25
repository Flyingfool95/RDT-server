import { Application } from "jsr:@oak/oak";
import { corsMiddleware } from "./middlewares/cors.middleware.ts";
import router from "./routes/main.router.ts";

const app = new Application();

app.use(corsMiddleware);
app.use(router.routes());

await app.listen({ port: 8000 });
