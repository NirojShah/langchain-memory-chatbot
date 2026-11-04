import { jest } from "@jest/globals";
import Fastify from "fastify";
import userRoutes from "./user.route.js";
import UserService from "./user.service.js";
import AuthService from "../../auth/auth.service.js";
import { globalErrorHandler } from "../../utility/errorHandler.js";

describe("User Routes (API Integration)", () => {
    let app: ReturnType<typeof Fastify>;
    const validUserId = "64f1a2b3c4d5e6f7a8b9c0d1";
    const validToken = "valid.test.jwt";

    beforeAll(async () => {
        app = Fastify({
            ajv: {
                customOptions: {
                    removeAdditional: false,
                },
            },
        });
        app.setErrorHandler(globalErrorHandler);
        await app.register(userRoutes, { prefix: "/api/users" });
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("POST /api/users/register", () => {
        it("should return 201 and registered user for valid payload", async () => {
            const payload = {
                userName: "john_doe",
                email: "john@example.com",
                password: "password123",
            };
            const mockServiceResult = {
                message: "User registered successfully",
                user: { id: validUserId, userName: "john_doe", email: "john@example.com" },
            };
            jest.spyOn(UserService, "register").mockResolvedValue(mockServiceResult as any);

            const res = await app.inject({
                method: "POST",
                url: "/api/users/register",
                payload,
            });

            expect(res.statusCode).toBe(201);
            expect(res.json()).toEqual(mockServiceResult);
        });

        it("should return 400 when registration body fails validation", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/api/users/register",
                payload: {
                    userName: "john_doe",
                    email: "not-an-email",
                    password: "123", // too short
                },
            });

            expect(res.statusCode).toBe(400);
            expect(res.json().success).toBe(false);
        });
    });

    describe("POST /api/users/login", () => {
        it("should return 200 for valid credentials", async () => {
            const payload = {
                email: "john@example.com",
                password: "password123",
            };
            const mockLoginResult = {
                message: "Login successful",
                userId: validUserId,
            };
            jest.spyOn(UserService, "login").mockResolvedValue(mockLoginResult as any);

            const res = await app.inject({
                method: "POST",
                url: "/api/users/login",
                payload,
            });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual(mockLoginResult);
        });

        it("should return 400 when login payload is missing password", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/api/users/login",
                payload: {
                    email: "john@example.com",
                },
            });

            expect(res.statusCode).toBe(400);
            expect(res.json().success).toBe(false);
        });
    });

    describe("GET /api/users/me", () => {
        it("should return 401 when Authorization header is missing", async () => {
            const res = await app.inject({
                method: "GET",
                url: "/api/users/me",
            });

            expect(res.statusCode).toBe(401);
            expect(res.json().success).toBe(false);
        });

        it("should return 200 and user profile for authenticated user", async () => {
            const mockUser = {
                id: validUserId,
                userName: "john_doe",
                email: "john@example.com",
            };
            jest.spyOn(AuthService, "verifyAccessToken").mockReturnValue(validUserId as any);
            jest.spyOn(UserService, "getUser").mockResolvedValue(mockUser as any);

            const res = await app.inject({
                method: "GET",
                url: "/api/users/me",
                headers: {
                    authorization: `Bearer ${validToken}`,
                },
            });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual(mockUser);
        });
    });

    describe("PATCH /api/users/me", () => {
        it("should return 401 when Authorization header is missing", async () => {
            const res = await app.inject({
                method: "PATCH",
                url: "/api/users/me",
                payload: { userName: "new_name" },
            });

            expect(res.statusCode).toBe(401);
        });

        it("should return 400 when payload is empty (minProperties validation)", async () => {
            const res = await app.inject({
                method: "PATCH",
                url: "/api/users/me",
                headers: {
                    authorization: `Bearer ${validToken}`,
                },
                payload: {},
            });

            expect(res.statusCode).toBe(400);
        });

        it("should return 200 when updating profile with valid data", async () => {
            const mockUpdateResult = {
                message: "User updated successfully",
                user: { id: validUserId, userName: "updated_john", email: "john@example.com" },
            };
            jest.spyOn(AuthService, "verifyAccessToken").mockReturnValue(validUserId as any);
            jest.spyOn(UserService, "updateUser").mockResolvedValue(mockUpdateResult as any);

            const res = await app.inject({
                method: "PATCH",
                url: "/api/users/me",
                headers: {
                    authorization: `Bearer ${validToken}`,
                },
                payload: {
                    userName: "updated_john",
                },
            });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual(mockUpdateResult);
        });
    });

    describe("DELETE /api/users/me", () => {
        it("should return 401 when Authorization header is missing", async () => {
            const res = await app.inject({
                method: "DELETE",
                url: "/api/users/me",
            });

            expect(res.statusCode).toBe(401);
        });

        it("should return 200 when deactivating account", async () => {
            const mockDeactivateResult = { message: "User deactivated successfully" };
            jest.spyOn(AuthService, "verifyAccessToken").mockReturnValue(validUserId as any);
            jest.spyOn(UserService, "deactivateUser").mockResolvedValue(mockDeactivateResult as any);

            const res = await app.inject({
                method: "DELETE",
                url: "/api/users/me",
                headers: {
                    authorization: `Bearer ${validToken}`,
                },
            });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual(mockDeactivateResult);
        });
    });

    describe("POST /api/users/logout", () => {
        it("should return 401 when Authorization header is missing", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/api/users/logout",
            });

            expect(res.statusCode).toBe(401);
        });

        it("should return 200 when logging out successfully", async () => {
            const mockLogoutResult = { message: "Logout successful" };
            jest.spyOn(AuthService, "verifyAccessToken").mockReturnValue(validUserId as any);
            jest.spyOn(UserService, "logout").mockResolvedValue(mockLogoutResult as any);

            const res = await app.inject({
                method: "POST",
                url: "/api/users/logout",
                headers: {
                    authorization: `Bearer ${validToken}`,
                },
            });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual(mockLogoutResult);
        });
    });
});
