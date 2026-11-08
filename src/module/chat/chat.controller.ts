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
}

export default ChatController;