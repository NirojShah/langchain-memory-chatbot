process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-jwt-access-secret-32-chars-long!";

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import bcrypt from "bcrypt";
import type { FastifyReply, FastifyRequest } from "fastify";

import app from "../src/app.js";
import UserRepository from "../src/module/user/user.repository.js";
import UserService from "../src/module/user/user.service.js";
import UserController from "../src/module/user/user.controller.js";

// Suppress Fastify logger during tests for clean test output
app.log.level = "silent";

const VALID_USER_ID = "507f1f77bcf86cd799439011";

describe("User Module API & Unit Tests", () => {
    afterEach(() => {
        mock.reset();
    });

    describe("POST /users/register - API & Validation", () => {
        it("should successfully register a new user and return 201", async () => {
            mock.method(UserRepository, "findByEmailIncludingInactive", async () => null);
            mock.method(UserRepository, "create", async (data: any) => ({
                _id: VALID_USER_ID,
                userName: data.userName,
                email: data.email,
                isActive: true,
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
            }));

            const response = await app.inject({
                method: "POST",
                url: "/users/register",
                payload: {
                    userName: "JaneDoe",
                    email: "janedoe@example.com",
                    password: "password123",
                },
            });

            assert.equal(response.statusCode, 201);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "User registered successfully");
            assert.equal(body.user.userName, "JaneDoe");
            assert.equal(body.user.email, "janedoe@example.com");
            assert.equal(body.user.id, VALID_USER_ID);
            assert.equal(body.user.isActive, true);
        });

        it("should fail with 400 when userName is missing", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/users/register",
                payload: {
                    email: "jane@example.com",
                    password: "password123",
                },
            });

            assert.equal(response.statusCode, 400);
            const body = JSON.parse(response.body);
            assert.equal(body.success, false);
            assert.equal(body.message, "Validation Error");
        });

        it("should fail with 400 when email is missing", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/users/register",
                payload: {
                    userName: "JaneDoe",
                    password: "password123",
                },
            });

            assert.equal(response.statusCode, 400);
            const body = JSON.parse(response.body);
            assert.equal(body.success, false);
            assert.equal(body.message, "Validation Error");
        });

        it("should fail with 400 when email format is invalid", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/users/register",
                payload: {
                    userName: "JaneDoe",
                    email: "not-an-email",
                    password: "password123",
                },
            });

            assert.equal(response.statusCode, 400);
            const body = JSON.parse(response.body);
            assert.equal(body.success, false);
            assert.equal(body.message, "Validation Error");
        });

        it("should fail with 400 when password is shorter than 8 characters", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/users/register",
                payload: {
                    userName: "JaneDoe",
                    email: "jane@example.com",
                    password: "short",
                },
            });

            assert.equal(response.statusCode, 400);
            const body = JSON.parse(response.body);
            assert.equal(body.success, false);
            assert.equal(body.message, "Validation Error");
        });

        it("should strip unexpected properties and register successfully", async () => {
            mock.method(UserRepository, "findByEmailIncludingInactive", async () => null);
            mock.method(UserRepository, "create", async (data: any) => ({
                _id: VALID_USER_ID,
                userName: data.userName,
                email: data.email,
                isActive: true,
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
            }));

            const response = await app.inject({
                method: "POST",
                url: "/users/register",
                payload: {
                    userName: "JaneDoe",
                    email: "jane@example.com",
                    password: "password123",
                    role: "admin",
                },
            });

            assert.equal(response.statusCode, 201);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "User registered successfully");
            assert.equal(body.user.userName, "JaneDoe");
        });

        it("should return 409 Conflict if email is already registered", async () => {
            mock.method(UserRepository, "findByEmailIncludingInactive", async () => ({
                _id: VALID_USER_ID,
                email: "jane@example.com",
            }));

            const response = await app.inject({
                method: "POST",
                url: "/users/register",
                payload: {
                    userName: "JaneDoe",
                    email: "jane@example.com",
                    password: "password123",
                },
            });

            assert.equal(response.statusCode, 409);
            const body = JSON.parse(response.body);
            assert.equal(body.success, false);
            assert.equal(body.message, "Email is already registered");
        });

        it("should return 409 Conflict when database raises duplicate key error (code 11000)", async () => {
            mock.method(UserRepository, "findByEmailIncludingInactive", async () => null);
            mock.method(UserRepository, "create", async () => {
                const mongoError = new Error("Duplicate key error") as any;
                mongoError.code = 11000;
                throw mongoError;
            });

            const response = await app.inject({
                method: "POST",
                url: "/users/register",
                payload: {
                    userName: "JaneDoe",
                    email: "jane@example.com",
                    password: "password123",
                },
            });

            assert.equal(response.statusCode, 409);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "Email is already registered");
        });
    });

    describe("UserService.register - Unit Tests", () => {
        it("register throws 400 if username, email, or password are missing or empty", async () => {
            await assert.rejects(
                () => UserService.register({ userName: "", email: "a@b.com", password: "password123" }),
                (err: any) => err.statusCode === 400 && err.message === "Username, email, and password are required"
            );
            await assert.rejects(
                () => UserService.register({ userName: "Alice", email: "", password: "password123" }),
                (err: any) => err.statusCode === 400 && err.message === "Username, email, and password are required"
            );
            await assert.rejects(
                () => UserService.register({ userName: "Alice", email: "a@b.com", password: "" }),
                (err: any) => err.statusCode === 400 && err.message === "Username, email, and password are required"
            );
        });

        it("register throws 400 if password length is < 8", async () => {
            await assert.rejects(
                () => UserService.register({ userName: "Alice", email: "a@b.com", password: "123" }),
                (err: any) => err.statusCode === 400 && err.message === "Password must be at least 8 characters long"
            );
        });
    });

    describe("UserController.register - Unit Tests", () => {
        it("UserController.register delegates to UserService.register", async () => {
            mock.method(UserService, "register", async () => ({
                message: "User registered successfully",
                user: { id: VALID_USER_ID, userName: "Test", email: "t@e.com", isActive: true, createdAt: new Date() },
            }));

            let sentCode = 0;
            let sentBody: any = null;
            const reply = {
                code: (c: number) => {
                    sentCode = c;
                    return reply;
                },
                send: (b: any) => {
                    sentBody = b;
                    return reply;
                },
            } as unknown as FastifyReply;

            const request = {
                body: { userName: "Test", email: "t@e.com", password: "password123" },
            } as FastifyRequest<{ Body: any }>;

            await UserController.register(request, reply);
            assert.equal(sentCode, 201);
            assert.equal(sentBody.message, "User registered successfully");
        });
    });

    describe("POST /users/login - API & Authentication", () => {
        it("should successfully login with valid credentials and return 200 with tokens", async () => {
            const hashedPassword = await bcrypt.hash("validPassword123", 10);
            mock.method(UserRepository, "findByEmailForAuth", async () => ({
                _id: VALID_USER_ID,
                userName: "JaneDoe",
                email: "jane@example.com",
                password: hashedPassword,
                isActive: true,
            }));
            mock.method(UserRepository, "setRefreshTokenHash", async () => ({
                _id: VALID_USER_ID,
                userName: "JaneDoe",
                email: "jane@example.com",
            }));

            const response = await app.inject({
                method: "POST",
                url: "/users/login",
                payload: {
                    email: "jane@example.com",
                    password: "validPassword123",
                },
            });

            assert.equal(response.statusCode, 200);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "Login successful");
            assert.equal(body.user.email, "jane@example.com");
            assert.ok(body.accessToken, "Response should include accessToken");
            assert.ok(body.refreshToken, "Response should include refreshToken");
        });

        it("should fail with 400 when email is missing", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/users/login",
                payload: {
                    password: "validPassword123",
                },
            });

            assert.equal(response.statusCode, 400);
            const body = JSON.parse(response.body);
            assert.equal(body.success, false);
            assert.equal(body.message, "Validation Error");
        });

        it("should fail with 400 when password is missing", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/users/login",
                payload: {
                    email: "jane@example.com",
                },
            });

            assert.equal(response.statusCode, 400);
            const body = JSON.parse(response.body);
            assert.equal(body.success, false);
            assert.equal(body.message, "Validation Error");
        });

        it("should return 401 Unauthorized when user is not found", async () => {
            mock.method(UserRepository, "findByEmailForAuth", async () => null);

            const response = await app.inject({
                method: "POST",
                url: "/users/login",
                payload: {
                    email: "unknown@example.com",
                    password: "password123",
                },
            });

            assert.equal(response.statusCode, 401);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "Invalid email or password");
        });

        it("should return 401 Unauthorized when password does not match", async () => {
            const hashedPassword = await bcrypt.hash("correctPassword", 10);
            mock.method(UserRepository, "findByEmailForAuth", async () => ({
                _id: VALID_USER_ID,
                userName: "JaneDoe",
                email: "jane@example.com",
                password: hashedPassword,
                isActive: true,
            }));

            const response = await app.inject({
                method: "POST",
                url: "/users/login",
                payload: {
                    email: "jane@example.com",
                    password: "wrongPassword",
                },
            });

            assert.equal(response.statusCode, 401);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "Invalid email or password");
        });
    });

    describe("UserController.login - Unit Tests", () => {
        it("UserController.login delegates to UserService.login", async () => {
            mock.method(UserService, "login", async () => ({
                message: "Login successful",
                user: { id: VALID_USER_ID, userName: "Test", email: "t@e.com" },
                accessToken: "token123",
            }));

            let sentBody: any = null;
            const reply = {
                send: (b: any) => {
                    sentBody = b;
                    return reply;
                },
            } as unknown as FastifyReply;

            const request = {
                body: { email: "t@e.com", password: "password123" },
            } as FastifyRequest<{ Body: any }>;

            await UserController.login(request, reply);
            assert.equal(sentBody.message, "Login successful");
            assert.equal(sentBody.accessToken, "token123");
        });
    });
});
