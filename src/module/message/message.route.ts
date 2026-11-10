import type { FastifyPluginAsync } from "fastify";
import { MessageRepository, MessageRepository as MessageRepositoryType } from "./message.repository.js";
import { MessageService, MessageService as MessageServiceType } from "./message.service.js";
import { MessageController as MessageControllerType, MessageController } from "./message.controller.js";

const messageRepository: MessageRepositoryType = new MessageRepository();
const messageService: MessageServiceType = new MessageService(messageRepository);
const messageController: MessageControllerType = new MessageController(messageService);

const messageRoutes: FastifyPluginAsync = async (app) => {
    app.post<{ Body: { chatId: string, userId: string, content: string } }>(
        "/new-message",
        messageController.newMessage
    );

    app.post<{ Body: { chatId: string, userId: string, content: string } }>(
        "/create-message",
        messageController.newMessage
    );

    app.get<{ Params: { chatId: string }, Querystring: { page: number, limit: number } }>(
        "/messages/:chatId",
        messageController.myMessages
    );

    app.get<{ Params: { chatId: string }, Querystring: { page: number, limit: number } }>(
        "/chat-messages/:chatId",
        messageController.myMessages
    );

    app.get<{ Params: { chatId: string }, Querystring: { page: number, limit: number } }>(
        "/my-messages/:chatId",
        messageController.myMessages
    );
};

export default messageRoutes;
