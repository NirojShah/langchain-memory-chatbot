import Fastify from "fastify";
import { globalErrorHandler } from "./utility/errorHandler.js";
import appRouter from "./router/app.router.js";

const app = Fastify({
    logger: true,
});

app.setErrorHandler(globalErrorHandler);
app.register(appRouter)

app.get("/", async () => {
    return {
        message: "LangChain Memory Chatbot API is running!",
    };
});

export default app;