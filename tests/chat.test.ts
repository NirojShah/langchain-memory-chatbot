import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import type { FastifyReply, FastifyRequest } from "fastify";

import app from "../src/app.js";
import Chat from "../src/module/chat/chat.model.js";
import { ChatRepository } from "../src/module/chat/chat.repository.js";
import { ChatService } from "../src/module/chat/chat.service.js";
import { ChatController } from "../src/module/chat/chat.controller.js";
import type { ChatModelType } from "../src/module/chat/chat.datatype.js";

// Suppress Fastify logger during tests for clean test output
app.log.level = "silent";

const VALID_USER_ID = "507f1f77bcf86cd799439011";
const CHAT_ID = "507f1f77bcf86cd799439022";

describe("Chat Module API & Unit Tests", () => {
    afterEach(() => {
        mock.reset();
    });

    describe("POST /chat/new-chat - API Endpoint", () => {
        it("should successfully create a new chat and return 200 with chat document", async () => {
            const mockCreatedChat = {
                _id: CHAT_ID,
                userId: VALID_USER_ID,
                createdAt: new Date("2026-01-01T10:00:00.000Z"),
                updatedAt: new Date("2026-01-01T10:00:00.000Z"),
            };

            mock.method(Chat, "create", async () => mockCreatedChat);

            const response = await app.inject({
                method: "POST",
                url: "/chat/new-chat",
                payload: {
                    userId: VALID_USER_ID,
                },
            });

            assert.equal(response.statusCode, 200);
            const body = JSON.parse(response.body);
            assert.equal(body._id, CHAT_ID);
            assert.equal(body.userId, VALID_USER_ID);
            assert.ok(body.createdAt);
            assert.ok(body.updatedAt);
        });

        it("should return 500 when database fails to create chat", async () => {
            mock.method(Chat, "create", async () => {
                throw new Error("Database write error");
            });

            const response = await app.inject({
                method: "POST",
                url: "/chat/new-chat",
                payload: {
                    userId: VALID_USER_ID,
                },
            });

            assert.equal(response.statusCode, 500);
            const body = JSON.parse(response.body);
            assert.equal(body.success, false);
            assert.equal(body.message, "Database write error");
        });
    });

    describe("ChatController.newChat - Unit Tests", () => {
        it("newChat calls chatService.createNewChat with userId and sends response", async () => {
            let passedUserId = "";
            const mockChatService = {
                createNewChat: async (userId: string) => {
                    passedUserId = userId;
                    return { _id: CHAT_ID, userId };
                },
                getChatByUserId: async () => [],
            } as unknown as ChatService;

            const controller = new ChatController(mockChatService);

            let sentData: any = null;
            const reply = {
                send: (data: any) => {
                    sentData = data;
                },
            } as unknown as FastifyReply;

            const request = {
                body: { userId: VALID_USER_ID },
            } as FastifyRequest<{ Body: ChatModelType }>;

            await controller.newChat(request, reply);

            assert.equal(passedUserId, VALID_USER_ID);
            assert.equal(sentData._id, CHAT_ID);
            assert.equal(sentData.userId, VALID_USER_ID);
        });
    });

    describe("ChatService.createNewChat - Unit Tests", () => {
        it("createNewChat delegates to chatRepository.createNewChat and returns result", async () => {
            const expectedChat = {
                _id: CHAT_ID,
                userId: VALID_USER_ID,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const mockRepo = {
                createNewChat: async (userId: string) => {
                    assert.equal(userId, VALID_USER_ID);
                    return expectedChat;
                },
                fetchChatsByUserId: async () => [],
            } as unknown as ChatRepository;

            const service = new ChatService(mockRepo);
            const result = await service.createNewChat(VALID_USER_ID);

            assert.deepEqual(result, expectedChat);
        });

        it("createNewChat returns undefined when repository returns null", async () => {
            const mockRepo = {
                createNewChat: async () => null,
                fetchChatsByUserId: async () => [],
            } as unknown as ChatRepository;

            const service = new ChatService(mockRepo);
            const result = await service.createNewChat(VALID_USER_ID);

            assert.equal(result, undefined);
        });
    });

    describe("ChatRepository.createNewChat - Unit Tests", () => {
        it("createNewChat calls Chat.create with userId and returns the chat document", async () => {
            let capturedData: any = null;
            const createdDoc = {
                _id: CHAT_ID,
                userId: VALID_USER_ID,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mock.method(Chat, "create", async (data: any) => {
                capturedData = data;
                return createdDoc;
            });

            const repo = new ChatRepository();
            const result = await repo.createNewChat(VALID_USER_ID);

            assert.deepEqual(capturedData, { userId: VALID_USER_ID });
            assert.deepEqual(result, createdDoc);
        });
    });
});
