import type { FastifyPluginAsync } from "fastify";
import { chatContainer } from "./chat.container.js";
import { ChatController } from "./chat.controller.js";
import type { ChatModelType } from "./chat.datatype.js";

const chatController = chatContainer.get(ChatController);

const chatRoutes: FastifyPluginAsync = async (app) => {
    app.post<{ Body: ChatModelType }>("/new-chat",
        chatController.newChat
    );

    app.get<{
        Params: { userId: string },
        Querystring: { page: number, limit: number }
    }>("/my-chats", chatController.myChats)
}

export default chatRoutes