import type { MessageModelType } from "./message.datatype.js";
import Message from "./message.model.js";

interface MessageRepositoryI {
    createNewMessage(chatId: string, userId: string, content: string): Promise<any>;
}

class MessageRepository implements MessageRepositoryI {
    async createNewMessage(chatId: string, userId: string, content: string) {
        return await Message.create({
            chatId,
            userId,
            content,
        });
    }
}

export default new MessageRepository();
export {
    MessageRepository,
};
