import type { FastifyPluginAsync } from "fastify";
import { ChatRepository, ChatRepository as ChatRepositoryType } from "./chat.repository.js";
import { ChatService, ChatService as ChatServiceType } from "./chat.service.js";
import { ChatController as ChatControllerType, ChatController } from "./chat.controller.js";
import type { ChatModelType } from "./chat.datatype.js";

const chatRepository: ChatRepositoryType = new ChatRepository();
const chatService: ChatServiceType = new ChatService(chatRepository);
const chatController: ChatControllerType = new ChatController(chatService);

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