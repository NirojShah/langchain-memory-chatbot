import Chat from "./chat.model.js";

interface ChatRepositoryI {
    createNewChat(userId: string): any;
}

class ChatRepository implements ChatRepositoryI {
    async createNewChat(userId: string) {
        const chat = await Chat.create({
            userId: userId
        })
        return chat
    }

}

export default ChatRepository;