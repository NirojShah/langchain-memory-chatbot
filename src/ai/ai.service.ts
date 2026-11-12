import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { type BaseMessage, HumanMessage, AIMessage, isAIMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
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

export interface ConversationChainOptions {
    model?: BaseChatModel;
    modelConfig?: ModelConfig;
    systemPrompt?: string;
    userId?: string;
    historyFactory?: (chatId: string) => BaseListChatMessageHistory;
}

/**
 * Factory class for creating runnable chains with persistent chat message history
 */
export class ConversationChainFactory {
    static createChain(options: ConversationChainOptions = {}): RunnableWithMessageHistory<any, any> {
        const model = options.model || ChatModelFactory.createModel(options.modelConfig);
        const modelName = ChatModelFactory.getModelName(model, options.modelConfig);

        const systemPrompt =
            options.systemPrompt ||
            "You are a helpful, respectful, and intelligent AI assistant. Use the conversation history to provide contextual and coherent responses.";

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", systemPrompt],
            new MessagesPlaceholder("history"),
            ["human", "{input}"],
        ]);

        const chain = prompt.pipe(model);

        const historyFactory =
            options.historyFactory ||
            ((sessionId: string) => {
                return ChatHistoryFactory.createHistory(sessionId, {
                    ...(options.userId ? { userId: options.userId } : {}),
                    modelName,
                });
            });

        return new RunnableWithMessageHistory({
            runnable: chain,
            getMessageHistory: historyFactory,
            inputMessagesKey: "input",
            historyMessagesKey: "history",
        });
    }
}

/**
 * Factory function to create a conversation chain with persistent history
 */
export const createConversationChain = (
    options?: ConversationChainOptions
): RunnableWithMessageHistory<any, any> => {
    return ConversationChainFactory.createChain(options);
};

/**
 * Persists an AI model response directly into the Message collection
 * using the chatId and the AI model name as the sender.
 */
export const saveAiMessage = async (
    chatId: string,
    content: string,
    modelName: string,
    userId?: string
): Promise<any> => {
    return await Message.create({
        chatId,
        userId: userId || "ai",
        sender: modelName,
        content,
    });
};

/**
 * Persists a user message directly into the Message collection.
 */
export const saveUserMessage = async (
    chatId: string,
    content: string,
    userId: string
): Promise<any> => {
    return await Message.create({
        chatId,
        userId,
        sender: userId || "user",
        content,
    });
};

export interface SendMessageParams {
    chatId: string;
    message: string;
    userId?: string;
    modelConfig?: ModelConfig;
    model?: BaseChatModel;
    systemPrompt?: string;
}

export interface SendMessageResult {
    reply: string;
    model: string;
    chatId: string;
    sender: string;
    aiMessageDoc?: any;
}

/**
 * Sends a message, maintains conversation memory across turns,
 * and saves the AI response to Message collection with model name as sender.
 */
export const sendMessage = async (params: SendMessageParams): Promise<SendMessageResult> => {
    if (!params.chatId || typeof params.chatId !== "string" || !params.chatId.trim()) {
        throw new Error("chatId is required");
    }
    if (!params.message || typeof params.message !== "string" || !params.message.trim()) {
        throw new Error("message content is required");
    }

    const model = params.model || ChatModelFactory.createModel(params.modelConfig);
    const modelName = ChatModelFactory.getModelName(model, params.modelConfig);

    const chain = ConversationChainFactory.createChain({
        model,
        ...(params.modelConfig ? { modelConfig: params.modelConfig } : {}),
        ...(params.systemPrompt ? { systemPrompt: params.systemPrompt } : {}),
        ...(params.userId ? { userId: params.userId } : {}),
    });

    const response = await chain.invoke(
        { input: params.message.trim() },
        { configurable: { sessionId: params.chatId } }
    );

    const reply =
        typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);

    let aiMessageDoc = await Message.findOne({
        chatId: params.chatId,
        sender: modelName,
    }).sort({ createdAt: -1 });

    if (!aiMessageDoc || aiMessageDoc.content !== reply) {
        aiMessageDoc = await saveAiMessage(params.chatId, reply, modelName, params.userId);
    }

    return {
        reply,
        model: modelName,
        chatId: params.chatId,
        sender: modelName,
        aiMessageDoc,
    };
};

/**
 * Retrieves the persisted chat history as LangChain BaseMessage objects
 */
export const getChatMessages = async (chatId: string): Promise<BaseMessage[]> => {
    const history = ChatHistoryFactory.createHistory(chatId);
    return await history.getMessages();
};

/**
 * Retrieves the raw persisted chat messages from MongoDB
 */
export const getStoredMessages = async (chatId: string): Promise<any[]> => {
    return await Message.find({ chatId }).sort({ createdAt: 1 }).lean();
};

/**
 * Clears/deletes all persistent chat history for the given chatId
 */
export const clearChatHistory = async (chatId: string): Promise<void> => {
    const history = ChatHistoryFactory.createHistory(chatId);
    await history.clear();
};

export interface AIServiceI {
    createModel(config?: ModelConfig): BaseChatModel;
    getChatHistory(chatId: string, options?: ChatHistoryOptions): MongoChatMessageHistory;
    createConversationChain(options?: ConversationChainOptions): RunnableWithMessageHistory<any, any>;
    saveAiMessage(chatId: string, content: string, modelName: string, userId?: string): Promise<any>;
    saveUserMessage(chatId: string, content: string, userId: string): Promise<any>;
    sendMessage(params: SendMessageParams): Promise<SendMessageResult>;
    getChatMessages(chatId: string): Promise<BaseMessage[]>;
    getStoredMessages(chatId: string): Promise<any[]>;
    clearChatHistory(chatId: string): Promise<void>;
}

/**
 * Main AI Service class coordinating chat memory persistence and LLM execution
 */
export class AIService implements AIServiceI {
    constructor(
        private readonly defaultModelConfig?: ModelConfig
    ) {}

    createModel(config?: ModelConfig): BaseChatModel {
        return createChatModel(config || this.defaultModelConfig);
    }

    getChatHistory(chatId: string, options?: ChatHistoryOptions): MongoChatMessageHistory {
        return createChatHistory(chatId, options);
    }

    createConversationChain(options?: ConversationChainOptions): RunnableWithMessageHistory<any, any> {
        return createConversationChain({
            ...(this.defaultModelConfig ? { modelConfig: this.defaultModelConfig } : {}),
            ...options,
        });
    }

    async saveAiMessage(chatId: string, content: string, modelName: string, userId?: string): Promise<any> {
        return await saveAiMessage(chatId, content, modelName, userId);
    }

    async saveUserMessage(chatId: string, content: string, userId: string): Promise<any> {
        return await saveUserMessage(chatId, content, userId);
    }

    async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
        return await sendMessage({
            ...(this.defaultModelConfig ? { modelConfig: this.defaultModelConfig } : {}),
            ...params,
        });
    }

    async getChatMessages(chatId: string): Promise<BaseMessage[]> {
        return await getChatMessages(chatId);
    }

    async getStoredMessages(chatId: string): Promise<any[]> {
        return await getStoredMessages(chatId);
    }

    async clearChatHistory(chatId: string): Promise<void> {
        await clearChatHistory(chatId);
    }
}

/**
 * Factory class for creating AIService instances
 */
export class AIServiceFactory {
    static createService(config?: ModelConfig): AIService {
        return new AIService(config);
    }
}

/**
 * Factory function for creating AIService instances
 */
export const createAIService = (config?: ModelConfig): AIService => {
    return AIServiceFactory.createService(config);
};

export default new AIService();
