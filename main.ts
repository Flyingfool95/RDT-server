import { Application } from "jsr:@oak/oak";
import { corsMiddleware } from "./middlewares/cors.middleware.ts";
import { errorHandler } from "./middlewares/error.middleware.ts";
import router from "./routes/main.routes.ts";
import "./db/db.ts";
import { CRONStarter } from "./middlewares/cron.middleware.ts";
import { headersMiddleware } from "./middlewares/headers.middleware.ts";

const app = new Application();

CRONStarter();

app.use(corsMiddleware);
app.use(headersMiddleware);
app.use(errorHandler);
app.use(router.routes());

export { app };

if (import.meta.main) {
    await app.listen({ port: 8000 });
}
