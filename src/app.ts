import Fastify from "fastify";
import { globalErrorHandler } from "./utility/errorHandler.js";

const app = Fastify({
    logger: true,
});

app.setErrorHandler(globalErrorHandler);

app.get("/", async () => {
    return {
        message: "LangChain Memory Chatbot API is running!",
    };
});

export default app;
