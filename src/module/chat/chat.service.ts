import type { ChatModelType } from "./chat.datatype.js"
import type { ChatRepository } from "./chat.repository.js"

interface ChatServiceI {
    createNewChat(userId: string): Promise<ChatModelType | undefined>
    getChatByUserId(userId: string, page: number, limit: number): Promise<ChatModelType[]>
}

class ChatService implements ChatServiceI {
    constructor(private readonly chatRepository: ChatRepository) { }

    async createNewChat(userId: string): Promise<ChatModelType | undefined> {
        const response: ChatModelType = await this.chatRepository.createNewChat(userId)
        if (response) {
            return response;
        }
    }
    async getChatByUserId(userId: string, page: number, limit: number): Promise<ChatModelType[]> {
        return this.chatRepository.fetchChatsByUserId(userId, page, limit)
    }
}

export { ChatService }