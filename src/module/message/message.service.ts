import type { MessageRepository } from "./message.repository.js";

interface MessageServiceI {
    createNewMessage(chatId: string, userId: string, content: string): Promise<any>;
}

class MessageService implements MessageServiceI {
    constructor(private readonly messageRepository: MessageRepository) { }

    async createNewMessage(chatId: string, userId: string, content: string): Promise<any> {
        const response = await this.messageRepository.createNewMessage(chatId, userId, content);
        if (response) {
            return response;
        }
    }

}

export {
    MessageService,
};
