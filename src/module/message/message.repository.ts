import type { MessageModelType } from "./message.datatype.js";
import Message from "./message.model.js";

interface MessageRepositoryI {
    createNewMessage(chatId: string, userId: string, content: string): Promise<any>;
    fetchMessagesByChatId(chatId: string, page: number, limit: number): Promise<MessageModelType[]>;
}

class MessageRepository implements MessageRepositoryI {
    async createNewMessage(chatId: string, userId: string, content: string) {
        return await Message.create({
            chatId,
            userId,
            content,
        });
    }

    async fetchMessagesByChatId(chatId: string, page: number, limit: number): Promise<MessageModelType[]> {
        return await Message.find({ chatId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
    }
}

export default new MessageRepository();
export {
    MessageRepository,
};
