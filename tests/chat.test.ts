import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import mongoose from "mongoose";
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
                code: () => ({
                    send: (data: any) => {
                        sentData = data;
                    },
                }),
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

    describe("GET /chat/my-chats - API Endpoint", () => {
        it("should return 200 and chat list", async () => {
            const mockChats = [
                {
                    _id: CHAT_ID,
                    userId: VALID_USER_ID,
                    createdAt: new Date("2026-01-01T10:00:00.000Z"),
                    updatedAt: new Date("2026-01-01T10:00:00.000Z"),
                },
            ];

            mock.method(Chat, "aggregate", async () => mockChats);

            const response = await app.inject({
                method: "GET",
                url: "/chat/my-chats",
            });

            assert.equal(response.statusCode, 200);
            const body = JSON.parse(response.body);
            assert.ok(Array.isArray(body));
            assert.equal(body.length, 1);
            assert.equal(body[0]._id, CHAT_ID);
        });

        it("should accept pagination query parameters page and limit", async () => {
            let capturedPipeline: any[] = [];
            mock.method(Chat, "aggregate", async (pipeline: any[]) => {
                capturedPipeline = pipeline;
                return [];
            });

            const response = await app.inject({
                method: "GET",
                url: "/chat/my-chats?page=2&limit=5",
            });

            assert.equal(response.statusCode, 200);
            const body = JSON.parse(response.body);
            assert.ok(Array.isArray(body));
            assert.equal(body.length, 0);

            const skipStage = capturedPipeline.find((s) => "$skip" in s);
            const limitStage = capturedPipeline.find((s) => "$limit" in s);
            assert.equal(Number(skipStage.$skip), 5); // (page 2 - 1) * 5 = 5
            assert.equal(Number(limitStage.$limit), 5);
        });
    });

    describe("ChatController.myChats - Unit Tests", () => {
        it("myChats calls chatService.getChatByUserId with params and query", async () => {
            let passedArgs: { userId: string; page: number; limit: number } | null = null;
            const mockChatService = {
                createNewChat: async () => ({}),
                getChatByUserId: async (userId: string, page: number, limit: number) => {
                    passedArgs = { userId, page, limit };
                    return [{ _id: CHAT_ID, userId }];
                },
            } as unknown as ChatService;

            const controller = new ChatController(mockChatService);

            let sentData: any = null;
            const reply = {
                code: () => ({
                    send: (data: any) => {
                        sentData = data;
                    },
                }),
                send: (data: any) => {
                    sentData = data;
                },
            } as unknown as FastifyReply;

            const request = {
                params: { userId: VALID_USER_ID },
                query: { page: 3, limit: 15 },
            } as unknown as FastifyRequest<{
                Params: { userId: string };
                Querystring: { page: number; limit: number };
            }>;

            await controller.myChats(request, reply);

            assert.deepEqual(passedArgs, {
                userId: VALID_USER_ID,
                page: 3,
                limit: 15,
            });
            assert.equal(sentData.length, 1);
            assert.equal(sentData[0]._id, CHAT_ID);
        });

        it("myChats defaults page to 1 and limit to 10 when query is empty", async () => {
            let passedArgs: { userId: string; page: number; limit: number } | null = null;
            const mockChatService = {
                createNewChat: async () => ({}),
                getChatByUserId: async (userId: string, page: number, limit: number) => {
                    passedArgs = { userId, page, limit };
                    return [];
                },
            } as unknown as ChatService;

            const controller = new ChatController(mockChatService);

            let sentData: any = null;
            const reply = {
                code: () => ({
                    send: (data: any) => {
                        sentData = data;
                    },
                }),
                send: (data: any) => {
                    sentData = data;
                },
            } as unknown as FastifyReply;

            const request = {
                params: { userId: VALID_USER_ID },
                query: {},
            } as unknown as FastifyRequest<{
                Params: { userId: string };
                Querystring: { page: number; limit: number };
            }>;

            await controller.myChats(request, reply);

            assert.deepEqual(passedArgs, {
                userId: VALID_USER_ID,
                page: 1,
                limit: 10,
            });
            assert.deepEqual(sentData, []);
        });
    });

    describe("ChatService.getChatByUserId - Unit Tests", () => {
        it("getChatByUserId delegates to chatRepository.fetchChatsByUserId and returns result", async () => {
            const expectedChats = [
                {
                    _id: CHAT_ID,
                    userId: VALID_USER_ID,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const mockRepo = {
                createNewChat: async () => null,
                fetchChatsByUserId: async (userId: string, page: number, limit: number) => {
                    assert.equal(userId, VALID_USER_ID);
                    assert.equal(page, 1);
                    assert.equal(limit, 10);
                    return expectedChats;
                },
            } as unknown as ChatRepository;

            const service = new ChatService(mockRepo);
            const result = await service.getChatByUserId(VALID_USER_ID, 1, 10);

            assert.deepEqual(result, expectedChats);
        });

        it("getChatByUserId returns null when repository returns null", async () => {
            const mockRepo = {
                createNewChat: async () => null,
                fetchChatsByUserId: async () => null as any,
            } as unknown as ChatRepository;

            const service = new ChatService(mockRepo);
            const result = await service.getChatByUserId(VALID_USER_ID, 1, 10);

            assert.equal(result, null);
        });
    });

    describe("ChatRepository.fetchChatsByUserId - Unit Tests", () => {
        it("fetchChatsByUserId builds correct aggregation pipeline with pagination", async () => {
            let capturedPipeline: any[] = [];
            const mockAggregatedChats = [
                {
                    _id: CHAT_ID,
                    userId: VALID_USER_ID,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mock.method(Chat, "aggregate", async (pipeline: any[]) => {
                capturedPipeline = pipeline;
                return mockAggregatedChats;
            });

            const repo = new ChatRepository();
            const page = 2;
            const limit = 10;
            const result = await repo.fetchChatsByUserId(VALID_USER_ID, page, limit);

            assert.deepEqual(result, mockAggregatedChats);
            assert.equal(capturedPipeline.length, 4);

            // Verify $match stage
            assert.deepEqual(capturedPipeline[0], {
                $match: { userId: new mongoose.Types.ObjectId(VALID_USER_ID) },
            });

            // Verify $sort stage
            assert.deepEqual(capturedPipeline[1], {
                $sort: { createdAt: -1 },
            });

            // Verify $skip stage: (2 - 1) * 10 = 10
            assert.deepEqual(capturedPipeline[2], {
                $skip: 10,
            });

            // Verify $limit stage
            assert.deepEqual(capturedPipeline[3], {
                $limit: 10,
            });
        });

        it("fetchChatsByUserId calculates skip correctly for page 1", async () => {
            let capturedPipeline: any[] = [];

            mock.method(Chat, "aggregate", async (pipeline: any[]) => {
                capturedPipeline = pipeline;
                return [];
            });

            const repo = new ChatRepository();
            await repo.fetchChatsByUserId(VALID_USER_ID, 1, 20);

            // For page 1, skip should be (1 - 1) * 20 = 0
            assert.deepEqual(capturedPipeline[2], {
                $skip: 0,
            });
            assert.deepEqual(capturedPipeline[3], {
                $limit: 20,
            });
        });
    });
});
