import mongoose from "mongoose";
import type { ChatModelType } from "./chat.datatype.js";
import Chat from "./chat.model.js";

interface ChatRepositoryI {
    createNewChat(userId: string): Promise<any>;
    fetchChatsByUserId(userId: string, page: number, limit: number): Promise<ChatModelType[]>;
}

class ChatRepository implements ChatRepositoryI {
    async createNewChat(userId: string) {
        const chat = await Chat.create({
            userId: userId
        })
        return chat
    }

    async fetchChatsByUserId(userId: string, page: number, limit: number): Promise<ChatModelType[]> {
        return await Chat.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ]);
    }


}

export default ChatRepository;