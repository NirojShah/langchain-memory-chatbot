import type { FastifyReply, FastifyRequest } from "fastify";
import type { MessageService } from "./message.service.js";

class MessageController {
    constructor(private readonly messageService: MessageService) { }

    newMessage = async (
        request: FastifyRequest<{ Body: { chatId: string, userId: string, content: string } }>,
        reply: FastifyReply
    ) => {
        const { chatId, userId, content } = request.body;
        const result = await this.messageService.createNewMessage(chatId, userId, content);
        reply.send(result);
    }
}

export {
    MessageController,
};
