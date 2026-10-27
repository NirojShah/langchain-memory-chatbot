
import Fastify from "fastify";

const app = Fastify({
    logger: true,
    
});

app.get("/", async () => {
    return {
        message: "LangChain Memory Chatbot API is running!",
    };
});

export default app;