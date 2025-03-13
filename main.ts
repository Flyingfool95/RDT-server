import { Application } from "jsr:@oak/oak";
import { corsMiddleware } from "./middlewares/cors.middleware.ts";
import { errorHandler } from "./middlewares/error.middleware.ts";
import router from "./routes/main.router.ts";
import "./db/db.ts";

const app = new Application();

app.use(corsMiddleware);
app.use(errorHandler);
app.use(router.routes());

await app.listen({ port: 8000 });
