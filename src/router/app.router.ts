import type { FastifyPluginAsync } from "fastify";
import chatRoutes from "../module/chat/chat.route.js";
import messageRoutes from "../module/message/message.route.js";
import userRoutes from "../module/user/user.route.js";

const appRouter: FastifyPluginAsync = async (app) => {
    app.register(userRoutes, {
        prefix: "/users",
    });

    app.register(chatRoutes, {
        prefix: "/chat",
    });

    app.register(messageRoutes, {
        prefix: "/message",
    });

    app.register(messageRoutes, {
        prefix: "/messages",
    });
};

export default appRouter;