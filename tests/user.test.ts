process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-jwt-access-secret-32-chars-long!";

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { FastifyReply, FastifyRequest } from "fastify";

import app from "../src/app.js";
import UserRepository from "../src/module/user/user.repository.js";
import UserService from "../src/module/user/user.service.js";
import UserController from "../src/module/user/user.controller.js";

// Suppress Fastify logger during tests for clean test output
app.log.level = "silent";

const VALID_USER_ID = "507f1f77bcf86cd799439011";
const OTHER_USER_ID = "507f191e810c19729de860ea";

const createValidToken = (userId: string = VALID_USER_ID, expiresIn: string = "15m") => {
    return jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET!, { expiresIn });
};

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

    describe("GET /users/me - API & Profile Retrieval", () => {
        it("should return 200 with user profile when valid Bearer token is provided", async () => {
            const token = createValidToken(VALID_USER_ID);
            mock.method(UserRepository, "findById", async (id: string) => ({
                _id: id,
                userName: "JaneDoe",
                email: "jane@example.com",
                isActive: true,
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                updatedAt: new Date("2026-01-02T00:00:00.000Z"),
            }));

            const response = await app.inject({
                method: "GET",
                url: "/users/me",
                headers: {
                    authorization: `Bearer ${token}`,
                },
            });

            assert.equal(response.statusCode, 200);
            const body = JSON.parse(response.body);
            assert.equal(body.id, VALID_USER_ID);
            assert.equal(body.userName, "JaneDoe");
            assert.equal(body.email, "jane@example.com");
            assert.equal(body.isActive, true);
        });

        it("should return 401 Unauthorized when Authorization header is missing", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/users/me",
            });

            assert.equal(response.statusCode, 401);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "Bearer access token is required");
        });

        it("should return 401 Unauthorized when Authorization header is not Bearer", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/users/me",
                headers: {
                    authorization: "Basic dXNlcjpwYXNz",
                },
            });

            assert.equal(response.statusCode, 401);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "Bearer access token is required");
        });

        it("should return 401 Unauthorized when token is invalid or malformed", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/users/me",
                headers: {
                    authorization: "Bearer invalid-token-string",
                },
            });

            assert.equal(response.statusCode, 401);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "Invalid or expired access token");
        });

        it("should return 401 Unauthorized when token has expired", async () => {
            const expiredToken = createValidToken(VALID_USER_ID, "-1s");

            const response = await app.inject({
                method: "GET",
                url: "/users/me",
                headers: {
                    authorization: `Bearer ${expiredToken}`,
                },
            });

            assert.equal(response.statusCode, 401);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "Invalid or expired access token");
        });

        it("should return 404 Not Found when user is not found or inactive", async () => {
            const token = createValidToken(VALID_USER_ID);
            mock.method(UserRepository, "findById", async () => null);

            const response = await app.inject({
                method: "GET",
                url: "/users/me",
                headers: {
                    authorization: `Bearer ${token}`,
                },
            });

            assert.equal(response.statusCode, 404);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "User not found");
        });

        it("should return 400 Bad Request when decoded userId is not a valid ObjectId", async () => {
            const token = jwt.sign({ sub: "invalid-user-id" }, process.env.JWT_ACCESS_SECRET!, { expiresIn: "15m" });

            const response = await app.inject({
                method: "GET",
                url: "/users/me",
                headers: {
                    authorization: `Bearer ${token}`,
                },
            });

            assert.equal(response.statusCode, 400);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "Invalid user ID");
        });
    });

    describe("UserService.getUser - Unit Tests", () => {
        it("getUser throws 400 if userId is not a valid ObjectId", async () => {
            await assert.rejects(
                () => UserService.getUser("invalid-id"),
                (err: any) => err.statusCode === 400 && err.message === "Invalid user ID"
            );
        });
    });

    describe("PATCH /users/me - API & Profile Updates", () => {
        it("should update userName successfully and return 200", async () => {
            const token = createValidToken(VALID_USER_ID);
            mock.method(UserRepository, "update", async (id: string, updates: any) => ({
                _id: id,
                userName: updates.userName,
                email: "jane@example.com",
                updatedAt: new Date("2026-01-03T00:00:00.000Z"),
            }));

            const response = await app.inject({
                method: "PATCH",
                url: "/users/me",
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {
                    userName: "Jane Updated",
                },
            });

            assert.equal(response.statusCode, 200);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "User updated successfully");
            assert.equal(body.user.userName, "Jane Updated");
        });

        it("should update email successfully when email is not taken", async () => {
            const token = createValidToken(VALID_USER_ID);
            mock.method(UserRepository, "findByEmail", async () => null);
            mock.method(UserRepository, "update", async (id: string, updates: any) => ({
                _id: id,
                userName: "JaneDoe",
                email: updates.email,
                updatedAt: new Date(),
            }));

            const response = await app.inject({
                method: "PATCH",
                url: "/users/me",
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {
                    email: "jane.new@example.com",
                },
            });

            assert.equal(response.statusCode, 200);
            const body = JSON.parse(response.body);
            assert.equal(body.user.email, "jane.new@example.com");
        });

        it("should fail with 400 when payload is empty (minProperties: 1)", async () => {
            const token = createValidToken(VALID_USER_ID);

            const response = await app.inject({
                method: "PATCH",
                url: "/users/me",
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {},
            });

            assert.equal(response.statusCode, 400);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "Validation Error");
        });

        it("should return 409 Conflict when updating to an email already in use by another user", async () => {
            const token = createValidToken(VALID_USER_ID);
            mock.method(UserRepository, "findByEmail", async () => ({
                _id: { toString: () => OTHER_USER_ID },
                email: "other@example.com",
            }));

            const response = await app.inject({
                method: "PATCH",
                url: "/users/me",
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {
                    email: "other@example.com",
                },
            });

            assert.equal(response.statusCode, 409);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "Email is already in use");
        });

        it("should return 409 Conflict when database raises duplicate key error (code 11000) during update", async () => {
            const token = createValidToken(VALID_USER_ID);
            mock.method(UserRepository, "findByEmail", async () => null);
            mock.method(UserRepository, "update", async () => {
                const error = new Error("Duplicate key") as any;
                error.code = 11000;
                throw error;
            });

            const response = await app.inject({
                method: "PATCH",
                url: "/users/me",
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {
                    email: "conflict@example.com",
                },
            });

            assert.equal(response.statusCode, 409);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "Email is already in use");
        });

        it("should return 404 Not Found if user to update does not exist or is inactive", async () => {
            const token = createValidToken(VALID_USER_ID);
            mock.method(UserRepository, "update", async () => null);

            const response = await app.inject({
                method: "PATCH",
                url: "/users/me",
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {
                    userName: "JaneDoe",
                },
            });

            assert.equal(response.statusCode, 404);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "User not found or inactive");
        });
    });

    describe("UserService.updateUser - Unit Tests", () => {
        it("updateUser throws 400 if empty object or no valid fields are provided", async () => {
            await assert.rejects(
                () => UserService.updateUser(VALID_USER_ID, {}),
                (err: any) => err.statusCode === 400 && err.message === "No valid fields provided for update"
            );
        });

        it("updateUser throws 400 if userName is empty whitespace", async () => {
            await assert.rejects(
                () => UserService.updateUser(VALID_USER_ID, { userName: "   " }),
                (err: any) => err.statusCode === 400 && err.message === "Username cannot be empty"
            );
        });

        it("updateUser throws 400 if email is empty whitespace", async () => {
            await assert.rejects(
                () => UserService.updateUser(VALID_USER_ID, { email: "   " }),
                (err: any) => err.statusCode === 400 && err.message === "Email cannot be empty"
            );
        });
    });

    describe("DELETE /users/me - API & User Deactivation", () => {
        it("should deactivate user successfully and return 200", async () => {
            const token = createValidToken(VALID_USER_ID);
            mock.method(UserRepository, "deactivate", async () => ({
                _id: VALID_USER_ID,
                isActive: false,
            }));

            const response = await app.inject({
                method: "DELETE",
                url: "/users/me",
                headers: {
                    authorization: `Bearer ${token}`,
                },
            });

            assert.equal(response.statusCode, 200);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "User deactivated successfully");
        });

        it("should return 401 Unauthorized when token is missing", async () => {
            const response = await app.inject({
                method: "DELETE",
                url: "/users/me",
            });

            assert.equal(response.statusCode, 401);
        });

        it("should return 404 Not Found when user does not exist or is already inactive", async () => {
            const token = createValidToken(VALID_USER_ID);
            mock.method(UserRepository, "deactivate", async () => null);

            const response = await app.inject({
                method: "DELETE",
                url: "/users/me",
                headers: {
                    authorization: `Bearer ${token}`,
                },
            });

            assert.equal(response.statusCode, 404);
            const body = JSON.parse(response.body);
            assert.equal(body.message, "User not found or already inactive");
        });
    });

    describe("UserService.deactivateUser - Unit Tests", () => {
        it("deactivateUser throws 400 if userId is invalid", async () => {
            await assert.rejects(
                () => UserService.deactivateUser("not-valid-id"),
                (err: any) => err.statusCode === 400 && err.message === "Invalid user ID"
            );
        });
    });
});
