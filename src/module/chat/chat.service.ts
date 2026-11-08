import type { ChatModelType } from "./chat.datatype.js"
import type { ChatRepository } from "./chat.repository.js"

interface ChatServiceI {
    createNewChat(userId: string): Promise<any>
}

class ChatService implements ChatServiceI {
    constructor(private readonly chatRepository: ChatRepository) { }

    async createNewChat(userId: string): Promise<any> {
        const response: ChatModelType = await this.chatRepository.createNewChat(userId)
        if (response) {
            return response;
        }
    }
}

export { ChatService }