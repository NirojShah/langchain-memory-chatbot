import type { FastifyReply, FastifyRequest } from "fastify";
import type { MessageService } from "./message.service.js";
import { OK } from "../../utility/statusCodes.js";

class MessageController {
    constructor(private readonly messageService: MessageService) { }

    newMessage = async (
        request: FastifyRequest<{ Body: { chatId: string, userId: string, content: string } }>,
        reply: FastifyReply
    ) => {
        const { chatId, userId, content } = request.body;
        const result = await this.messageService.createNewMessage(chatId, userId, content);
        return reply.code(OK.code).send(result);
    }

    myMessages = async (
        request: FastifyRequest<{ Params: { chatId: string }, Querystring: { page: number, limit: number } }>,
        reply: FastifyReply
    ) => {
        const chatId = request.params.chatId;
        const page = request.query.page || 1;
        const limit = request.query.limit || 10;

        const result = await this.messageService.getMessagesByChatId(chatId, page, limit);
        return reply.code(OK.code).send(result);
    }
}

export {
    MessageController,
};
