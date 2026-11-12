import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { type BaseMessage, HumanMessage, AIMessage, isAIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import Message from "../module/message/message.model.js";

export type SupportedProvider = "openai" | "google" | "gemini";

export interface ModelConfig {
    provider?: SupportedProvider | string;
    modelName?: string;
    temperature?: number;
    apiKey?: string;
    maxTokens?: number;
}

/**
 * Factory class for creating and managing Chat LLM instances
 */
export class ChatModelFactory {
    static createModel(config: ModelConfig = {}): BaseChatModel {
        const provider = (config.provider || process.env.AI_PROVIDER || "openai").toLowerCase();
        const temperature = config.temperature ?? 0.7;

        if (provider === "google" || provider === "gemini") {
            const modelName = config.modelName || process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash";
            const apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

            return new ChatGoogleGenerativeAI({
                model: modelName,
                temperature,
                ...(apiKey ? { apiKey } : {}),
                ...(config.maxTokens !== undefined ? { maxOutputTokens: config.maxTokens } : {}),
            });
        }

        const modelName = config.modelName || process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
        const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

        return new ChatOpenAI({
            model: modelName,
            temperature,
            ...(apiKey ? { apiKey } : {}),
            ...(config.maxTokens !== undefined ? { maxTokens: config.maxTokens } : {}),
        });
    }

    static getModelName(model: BaseChatModel, config?: ModelConfig): string {
        if (config?.modelName) {
            return config.modelName;
        }
        if ((model as any).modelName) {
            return (model as any).modelName;
        }
        if ((model as any).model) {
            return (model as any).model;
        }
        const provider = (config?.provider || process.env.AI_PROVIDER || "openai").toLowerCase();
        if (provider === "google" || provider === "gemini") {
            return process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash";
        }
        return process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
    }
}

/**
 * Factory function to create a Chat LLM model instance
 */
export const createChatModel = (config?: ModelConfig): BaseChatModel => {
    return ChatModelFactory.createModel(config);
};

export interface ChatHistoryOptions {
    userId?: string;
    modelName?: string;
}

/**
 * Custom LangChain Chat Message History persisting directly to MongoDB Message collection
 */
export class MongoChatMessageHistory extends BaseListChatMessageHistory {
    lc_namespace = ["langchain", "stores", "message", "mongo"];
    readonly chatId: string;
    readonly userId?: string;
    readonly modelName: string;

    constructor(chatId: string, options: ChatHistoryOptions = {}) {
        super();
        this.chatId = chatId;
        if (options.userId !== undefined) {
            this.userId = options.userId;
        }
        this.modelName = options.modelName || "ai-model";
    }

    async getMessages(): Promise<BaseMessage[]> {
        const docs = await Message.find({ chatId: this.chatId })
            .sort({ createdAt: 1 })
            .lean();

        return docs.map((doc) => {
            const sender = doc.sender;
            const isAi =
                sender === this.modelName ||
                (sender &&
                    sender !== "user" &&
                    sender !== this.userId &&
                    sender !== doc.userId);

            if (isAi) {
                return new AIMessage(doc.content);
            }
            return new HumanMessage(doc.content);
        });
    }

    async addMessage(message: BaseMessage): Promise<void> {
        const content =
            typeof message.content === "string"
                ? message.content
                : JSON.stringify(message.content);

        if (isAIMessage(message) || message._getType() === "ai") {
            await Message.create({
                chatId: this.chatId,
                userId: this.userId || "ai",
                sender: this.modelName,
                content,
            });
            return;
        }

        // Check if latest message in DB is already this message to prevent duplicate insertion
        const latest = await Message.findOne({ chatId: this.chatId }).sort({ createdAt: -1 });
        const sender = this.userId || "user";
        if (
            latest &&
            latest.content === content &&
            (latest.sender === sender || latest.userId === this.userId)
        ) {
            return;
        }

        await Message.create({
            chatId: this.chatId,
            userId: this.userId || "user",
            sender,
            content,
        });
    }

    async clear(): Promise<void> {
        await Message.deleteMany({ chatId: this.chatId });
    }
}

/**
 * Factory class for creating persistent MongoChatMessageHistory instances
 */
export class ChatHistoryFactory {
    static createHistory(chatId: string, options?: ChatHistoryOptions): MongoChatMessageHistory {
        return new MongoChatMessageHistory(chatId, options);
    }
}

/**
 * Factory function to retrieve or create persistent chat message history
 */
export const createChatHistory = (chatId: string, options?: ChatHistoryOptions): MongoChatMessageHistory => {
    return ChatHistoryFactory.createHistory(chatId, options);
};
