import Fastify from "fastify";
import { globalErrorHandler } from "./utility/errorHandler.js";
import { OK, STATUS_MESSAGES } from "./utility/statusCodes.js";
import appRouter from "./router/app.router.js";

const app = Fastify({
    logger: true,
});

app.setErrorHandler(globalErrorHandler);
app.register(appRouter);

app.get("/", async (_request, reply) => {
    reply.code(OK.code);
    return {
        message: STATUS_MESSAGES.API_RUNNING,
    };
});

export default app;