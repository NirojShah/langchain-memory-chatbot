import mongoose, { Schema, type Model } from "mongoose";
import type { ChatModelType } from "./chat.datatype.js";

const ChatSchema = new Schema<ChatModelType>({
    userId: {
        type: String,
        required: [true, "userId is required."],
    }
}, { timestamps: true });


const Chat: Model<ChatModelType> = mongoose.models.Chat ||
    mongoose.model<ChatModelType>("Chat", ChatSchema);

export default Chat;