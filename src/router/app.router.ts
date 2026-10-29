import type { FastifyPluginAsync } from "fastify";
import chatRoutes from "../module/chat/chat.route.js";
import userRoutes from "../module/user/user.route.js";


const appRouter: FastifyPluginAsync = async (app) => {
    app.register(userRoutes, {
        prefix: "/users",
    });

    app.register(chatRoutes, {
        prefix: "/chat",
    });
};

export default appRouter;