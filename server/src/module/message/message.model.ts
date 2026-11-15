import mongoose, { Schema, type Model } from "mongoose";
import type { MessageModelType } from "./message.datatype.js";

const MessageSchema = new Schema<MessageModelType>({
    chatId: {
        type: String,
        required: [true, "chatId is required."],
    },
    userId: {
        type: String,
        required: [true, "userId is required."],
    },
    sender: {
        type: String,
        required: false,
    },
    content: {
        type: String,
        required: [true, "content is required."],
        trim: true,
    },
}, { timestamps: true });

const Message: Model<MessageModelType> = mongoose.models.Message ||
    mongoose.model<MessageModelType>("Message", MessageSchema);

export default Message;
