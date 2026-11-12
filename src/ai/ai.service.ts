import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

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
