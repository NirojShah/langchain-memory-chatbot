import type { FastifyReply, FastifyRequest } from "fastify";
import type { ChatModelType } from "./chat.datatype.js";
import type { ChatService } from "./chat.service.js";

class ChatController {
    constructor(private readonly chatService: ChatService) { }
    newChat = async (
        request: FastifyRequest<{ Body: ChatModelType }>,
        reply: FastifyReply
    ) => {
        const userId: string = request.body.userId
        const result = await this.chatService.createNewChat(userId)
        reply.send(result)
    }

    myChats = async (
        request: FastifyRequest<{ Params: { userId: string }, Querystring: { page: number, limit: number } }>,
        reply: FastifyReply
    ) => {
        const userId: string = request.params.userId;
        const page: number = request.query.page || 1;
        const limit: number = request.query.limit || 10;

        const result = await this.chatService.getChatByUserId(userId, page, limit)
        reply.send(result)
    }
}

export default ChatController;