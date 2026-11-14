import type { FastifyPluginAsync } from "fastify";
import { messageContainer } from "./message.container.js";
import { MessageController } from "./message.controller.js";

const messageController = messageContainer.get(MessageController);

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
