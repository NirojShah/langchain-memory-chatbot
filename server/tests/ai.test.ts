import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import { FakeListChatModel } from "@langchain/core/utils/testing";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

import Message from "../src/module/message/message.model.js";
import {
    ChatModelFactory,
    createChatModel,
    MongoChatMessageHistory,
    ChatHistoryFactory,
    createChatHistory,
    ConversationChainFactory,
    createConversationChain,
    saveAiMessage,
    saveUserMessage,
    sendMessage,
    getChatMessages,
    getStoredMessages,
    clearChatHistory,
    AIService,
    AIServiceFactory,
    createAIService,
} from "../src/ai/ai.service.js";

const CHAT_ID = "chat-test-12345";
const USER_ID = "user-test-67890";
const MODEL_NAME = "gpt-4o-mini";

describe("AI Module & Persistent Memory Tests", () => {
    afterEach(() => {
        mock.reset();
    });

    describe("ChatModelFactory - LLM Factory Pattern", () => {
        it("should create OpenAI chat model by default", () => {
            const model = ChatModelFactory.createModel();
            assert.ok(model);
            const name = ChatModelFactory.getModelName(model);
            assert.equal(name, "gpt-4o-mini");
        });

        it("should create Google Gemini chat model when provider is google or gemini", () => {
            const model = ChatModelFactory.createModel({
                provider: "google",
                modelName: "gemini-1.5-flash",
                apiKey: "test-google-key",
            });
            assert.ok(model);
            const name = ChatModelFactory.getModelName(model, {
                provider: "google",
                modelName: "gemini-1.5-flash",
            });
            assert.equal(name, "gemini-1.5-flash");
        });

        it("createChatModel factory function should delegate to ChatModelFactory", () => {
            const model = createChatModel({ modelName: "gpt-4o" });
            assert.ok(model);
            const name = ChatModelFactory.getModelName(model, { modelName: "gpt-4o" });
            assert.equal(name, "gpt-4o");
        });
    });

    describe("MongoChatMessageHistory - History Persistence", () => {
        it("getMessages returns mapped AIMessage and HumanMessage instances from MongoDB Message collection", async () => {
            const mockDbMessages = [
                {
                    chatId: CHAT_ID,
                    userId: USER_ID,
                    sender: USER_ID,
                    content: "Hello AI, remember my favorite animal is an otter.",
                    createdAt: new Date("2026-01-01T10:00:00Z"),
                },
                {
                    chatId: CHAT_ID,
                    userId: "ai",
                    sender: MODEL_NAME,
                    content: "Got it! I will remember that your favorite animal is an otter.",
                    createdAt: new Date("2026-01-01T10:00:05Z"),
                },
            ];

            mock.method(Message, "find", () => ({
                sort: () => ({
                    lean: async () => mockDbMessages,
                }),
            }));

            const history = createChatHistory(CHAT_ID, {
                userId: USER_ID,
                modelName: MODEL_NAME,
            });

            const messages = await history.getMessages();
            assert.equal(messages.length, 2);
            assert.ok(messages[0] instanceof HumanMessage);
            assert.equal(messages[0]?.content, "Hello AI, remember my favorite animal is an otter.");
            assert.ok(messages[1] instanceof AIMessage);
            assert.equal(messages[1]?.content, "Got it! I will remember that your favorite animal is an otter.");
        });

        it("addMessage persists AI message with sender as model name", async () => {
            let createdPayload: any = null;
            mock.method(Message, "create", async (payload: any) => {
                createdPayload = payload;
                return payload;
            });

            const history = new MongoChatMessageHistory(CHAT_ID, {
                userId: USER_ID,
                modelName: MODEL_NAME,
            });

            await history.addMessage(new AIMessage("Hello, I am your assistant!"));

            assert.ok(createdPayload);
            assert.equal(createdPayload.chatId, CHAT_ID);
            assert.equal(createdPayload.sender, MODEL_NAME);
            assert.equal(createdPayload.content, "Hello, I am your assistant!");
        });

        it("addMessage persists human message with sender as userId", async () => {
            let createdPayload: any = null;
            mock.method(Message, "findOne", () => ({
                sort: async () => null,
            }));
            mock.method(Message, "create", async (payload: any) => {
                createdPayload = payload;
                return payload;
            });

            const history = ChatHistoryFactory.createHistory(CHAT_ID, {
                userId: USER_ID,
                modelName: MODEL_NAME,
            });

            await history.addMessage(new HumanMessage("What can you do?"));

            assert.ok(createdPayload);
            assert.equal(createdPayload.chatId, CHAT_ID);
            assert.equal(createdPayload.sender, USER_ID);
            assert.equal(createdPayload.content, "What can you do?");
        });

        it("clear deletes all messages for the specified chatId", async () => {
            let deletedQuery: any = null;
            mock.method(Message, "deleteMany", async (query: any) => {
                deletedQuery = query;
                return { acknowledged: true, deletedCount: 3 };
            });

            const history = createChatHistory(CHAT_ID);
            await history.clear();

            assert.deepEqual(deletedQuery, { chatId: CHAT_ID });
        });
    });

    describe("saveAiMessage & saveUserMessage", () => {
        it("saveAiMessage saves chat response with chatId and sender as ai-model name", async () => {
            let savedDoc: any = null;
            mock.method(Message, "create", async (payload: any) => {
                savedDoc = payload;
                return payload;
            });

            const result = await saveAiMessage(CHAT_ID, "This is an AI response.", MODEL_NAME, USER_ID);

            assert.equal(savedDoc.chatId, CHAT_ID);
            assert.equal(savedDoc.sender, MODEL_NAME);
            assert.equal(savedDoc.content, "This is an AI response.");
            assert.equal(savedDoc.userId, USER_ID);
            assert.deepEqual(result, savedDoc);
        });

        it("saveUserMessage saves user question with chatId and sender as userId", async () => {
            let savedDoc: any = null;
            mock.method(Message, "create", async (payload: any) => {
                savedDoc = payload;
                return payload;
            });

            const result = await saveUserMessage(CHAT_ID, "User question here", USER_ID);

            assert.equal(savedDoc.chatId, CHAT_ID);
            assert.equal(savedDoc.sender, USER_ID);
            assert.equal(savedDoc.content, "User question here");
            assert.deepEqual(result, savedDoc);
        });
    });

    describe("Conversation Chain & Memory Persistence Across Turns", () => {
        it("persists conversation history across turns so model remembers earlier context", async () => {
            // In-memory backing array simulating the Message collection
            const simulatedDatabase: any[] = [];

            mock.method(Message, "find", (query: any) => ({
                sort: () => ({
                    lean: async () => simulatedDatabase.filter((m) => m.chatId === query.chatId),
                }),
            }));

            mock.method(Message, "findOne", (query: any) => ({
                sort: async () => {
                    const matches = simulatedDatabase.filter((m) => m.chatId === query.chatId);
                    return matches[matches.length - 1] || null;
                },
            }));

            mock.method(Message, "create", async (payload: any) => {
                const doc = {
                    ...payload,
                    _id: "msg-" + (simulatedDatabase.length + 1),
                    createdAt: new Date(),
                };
                simulatedDatabase.push(doc);
                return doc;
            });

            // Mock model that replies in sequence
            const fakeModel = new FakeListChatModel({
                responses: [
                    "Nice to meet you! I will remember your name is Alice.",
                    "Your name is Alice!",
                ],
            });

            // Turn 1: User introduces themselves
            const turn1Result = await sendMessage({
                chatId: CHAT_ID,
                userId: USER_ID,
                message: "Hello, my name is Alice.",
                model: fakeModel,
                modelConfig: { modelName: MODEL_NAME },
            });

            assert.equal(turn1Result.reply, "Nice to meet you! I will remember your name is Alice.");
            assert.equal(turn1Result.sender, MODEL_NAME);
            assert.equal(turn1Result.model, MODEL_NAME);

            // Verify both Human and AI messages were persisted to DB
            assert.equal(simulatedDatabase.length, 2);
            assert.equal(simulatedDatabase[0]?.content, "Hello, my name is Alice.");
            assert.equal(simulatedDatabase[0]?.sender, USER_ID);
            assert.equal(simulatedDatabase[1]?.content, "Nice to meet you! I will remember your name is Alice.");
            assert.equal(simulatedDatabase[1]?.sender, MODEL_NAME);

            // Turn 2: User asks follow-up question
            const turn2Result = await sendMessage({
                chatId: CHAT_ID,
                userId: USER_ID,
                message: "What is my name?",
                model: fakeModel,
                modelConfig: { modelName: MODEL_NAME },
            });

            assert.equal(turn2Result.reply, "Your name is Alice!");
            assert.equal(turn2Result.sender, MODEL_NAME);

            // Verify history grew to 4 messages (2 human, 2 AI)
            assert.equal(simulatedDatabase.length, 4);
            assert.equal(simulatedDatabase[2]?.content, "What is my name?");
            assert.equal(simulatedDatabase[2]?.sender, USER_ID);
            assert.equal(simulatedDatabase[3]?.content, "Your name is Alice!");
            assert.equal(simulatedDatabase[3]?.sender, MODEL_NAME);

            // Check getChatMessages helper returns 4 BaseMessage instances
            const loadedHistory = await getChatMessages(CHAT_ID);
            assert.equal(loadedHistory.length, 4);
            assert.ok(loadedHistory[0] instanceof HumanMessage);
            assert.ok(loadedHistory[1] instanceof AIMessage);
            assert.ok(loadedHistory[2] instanceof HumanMessage);
            assert.ok(loadedHistory[3] instanceof AIMessage);
        });

        it("throws an error if chatId or message is missing in sendMessage", async () => {
            await assert.rejects(
                async () => {
                    await sendMessage({ chatId: "", message: "Hello" });
                },
                { message: "chatId is required" }
            );

            await assert.rejects(
                async () => {
                    await sendMessage({ chatId: CHAT_ID, message: "  " });
                },
                { message: "message content is required" }
            );
        });
    });

    describe("AIService & AIServiceFactory", () => {
        it("AIServiceFactory creates configured AIService instance", () => {
            const service = AIServiceFactory.createService({
                modelName: "gpt-4o",
            });
            assert.ok(service instanceof AIService);

            const model = service.createModel();
            assert.ok(model);
        });

        it("createAIService function creates and configures service", () => {
            const service = createAIService();
            assert.ok(service instanceof AIService);
        });
    });
});
