import { jest } from "@jest/globals";
import UserController from "./user.controller.js";
import UserService from "./user.service.js";
import AuthService from "../../auth/auth.service.js";
import { CustomError } from "../../utility/customError.js";

describe("UserController", () => {
    const validUserId = "64f1a2b3c4d5e6f7a8b9c0d1";
    const validToken = "valid.jwt.token";

    const createMockReply = () => {
        const reply: any = {};
        reply.code = jest.fn().mockReturnValue(reply);
        reply.send = jest.fn().mockReturnValue(reply);
        return reply;
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("register", () => {
        it("should call UserService.register and reply with status 201", async () => {
            const body = {
                userName: "john_doe",
                email: "john@example.com",
                password: "password123",
            };
            const mockResult = {
                message: "User registered successfully",
                user: { id: validUserId, userName: "john_doe", email: "john@example.com" },
            };
            jest.spyOn(UserService, "register").mockResolvedValue(mockResult as any);

            const request = { body } as any;
            const reply = createMockReply();

            await UserController.register(request, reply);

            expect(UserService.register).toHaveBeenCalledWith(body);
            expect(reply.code).toHaveBeenCalledWith(201);
            expect(reply.send).toHaveBeenCalledWith(mockResult);
        });
    });

    describe("login", () => {
        it("should call UserService.login and reply with result", async () => {
            const body = {
                email: "john@example.com",
                password: "password123",
            };
            const mockResult = {
                message: "Login successful",
                userId: validUserId,
            };
            jest.spyOn(UserService, "login").mockResolvedValue(mockResult as any);

            const request = { body } as any;
            const reply = createMockReply();

            await UserController.login(request, reply);

            expect(UserService.login).toHaveBeenCalledWith("john@example.com", "password123");
            expect(reply.send).toHaveBeenCalledWith(mockResult);
        });
    });

    describe("token extraction & authentication", () => {
        it("should throw CustomError (401) if authorization header is missing", async () => {
            const request = { headers: {} } as any;
            const reply = createMockReply();

            await expect(UserController.getMe(request, reply)).rejects.toThrow(CustomError);
        });

        it("should throw CustomError (401) if token format is not Bearer", async () => {
            const request = { headers: { authorization: "Basic 123456" } } as any;
            const reply = createMockReply();

            await expect(UserController.getMe(request, reply)).rejects.toThrow(CustomError);
        });

        it("should extract token and call AuthService.verifyAccessToken", async () => {
            jest.spyOn(AuthService, "verifyAccessToken").mockReturnValue(validUserId as any);
            jest.spyOn(UserService, "getUser").mockResolvedValue({ id: validUserId } as any);

            const request = {
                headers: { authorization: `Bearer ${validToken}` },
            } as any;
            const reply = createMockReply();

            await UserController.getMe(request, reply);

            expect(AuthService.verifyAccessToken).toHaveBeenCalledWith(validToken);
            expect(UserService.getUser).toHaveBeenCalledWith(validUserId);
        });
    });

    describe("getMe", () => {
        it("should return user profile for authenticated user", async () => {
            const mockUser = {
                id: validUserId,
                userName: "john_doe",
                email: "john@example.com",
            };
            jest.spyOn(AuthService, "verifyAccessToken").mockReturnValue(validUserId as any);
            jest.spyOn(UserService, "getUser").mockResolvedValue(mockUser as any);

            const request = {
                headers: { authorization: `Bearer ${validToken}` },
            } as any;
            const reply = createMockReply();

            await UserController.getMe(request, reply);

            expect(UserService.getUser).toHaveBeenCalledWith(validUserId);
            expect(reply.send).toHaveBeenCalledWith(mockUser);
        });
    });

    describe("updateMe", () => {
        it("should update authenticated user profile", async () => {
            const updateBody = { userName: "updated_john" };
            const mockResult = {
                message: "User updated successfully",
                user: { id: validUserId, userName: "updated_john", email: "john@example.com" },
            };
            jest.spyOn(AuthService, "verifyAccessToken").mockReturnValue(validUserId as any);
            jest.spyOn(UserService, "updateUser").mockResolvedValue(mockResult as any);

            const request = {
                headers: { authorization: `Bearer ${validToken}` },
                body: updateBody,
            } as any;
            const reply = createMockReply();

            await UserController.updateMe(request, reply);

            expect(UserService.updateUser).toHaveBeenCalledWith(validUserId, updateBody);
            expect(reply.send).toHaveBeenCalledWith(mockResult);
        });
    });

    describe("deactivateMe", () => {
        it("should deactivate authenticated user account", async () => {
            const mockResult = { message: "User deactivated successfully" };
            jest.spyOn(AuthService, "verifyAccessToken").mockReturnValue(validUserId as any);
            jest.spyOn(UserService, "deactivateUser").mockResolvedValue(mockResult as any);

            const request = {
                headers: { authorization: `Bearer ${validToken}` },
            } as any;
            const reply = createMockReply();

            await UserController.deactivateMe(request, reply);

            expect(UserService.deactivateUser).toHaveBeenCalledWith(validUserId);
            expect(reply.send).toHaveBeenCalledWith(mockResult);
        });
    });

    describe("logout", () => {
        it("should log out authenticated user", async () => {
            const mockResult = { message: "Logout successful" };
            jest.spyOn(AuthService, "verifyAccessToken").mockReturnValue(validUserId as any);
            jest.spyOn(UserService, "logout").mockResolvedValue(mockResult as any);

            const request = {
                headers: { authorization: `Bearer ${validToken}` },
            } as any;
            const reply = createMockReply();

            await UserController.logout(request, reply);

            expect(UserService.logout).toHaveBeenCalledWith(validUserId);
            expect(reply.send).toHaveBeenCalledWith(mockResult);
        });
    });
});
