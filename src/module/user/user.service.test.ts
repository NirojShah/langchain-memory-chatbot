import { jest } from "@jest/globals";
import bcrypt from "bcrypt";
import UserService from "./user.service.js";
import UserRepository from "./user.repository.js";
import AuthService from "../../auth/auth.service.js";
import { CustomError } from "../../utility/customError.js";

describe("UserService", () => {
    const validObjectId = "64f1a2b3c4d5e6f7a8b9c0d1";
    const anotherObjectId = "64f1a2b3c4d5e6f7a8b9c0d2";

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("register", () => {
        const validPayload = {
            userName: "  john_doe  ",
            email: "  John.Doe@Example.COM  ",
            password: "password123",
        };

        it("should successfully register a user", async () => {
            jest.spyOn(UserRepository, "findByEmailIncludingInactive").mockResolvedValue(null as any);
            jest.spyOn(bcrypt, "hash").mockImplementation(async () => "hashed_password123" as any);
            jest.spyOn(UserRepository, "create").mockResolvedValue({
                _id: validObjectId,
                userName: "john_doe",
                email: "john.doe@example.com",
            } as any);

            const result = await UserService.register(validPayload);

            expect(UserRepository.findByEmailIncludingInactive).toHaveBeenCalledWith("john.doe@example.com");
            expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);
            expect(UserRepository.create).toHaveBeenCalledWith({
                userName: "john_doe",
                email: "john.doe@example.com",
                password: "hashed_password123",
            });
            expect(result).toEqual({
                message: "User registered successfully",
                user: {
                    id: validObjectId,
                    userName: "john_doe",
                    email: "john.doe@example.com",
                },
            });
        });

        it("should throw CustomError (400) if userName is missing or empty", async () => {
            await expect(
                UserService.register({ ...validPayload, userName: "" })
            ).rejects.toThrow(CustomError);

            await expect(
                UserService.register({ ...validPayload, userName: undefined as any })
            ).rejects.toThrow(CustomError);
        });

        it("should throw CustomError (400) if email is missing or empty", async () => {
            await expect(
                UserService.register({ ...validPayload, email: "" })
            ).rejects.toThrow(CustomError);

            await expect(
                UserService.register({ ...validPayload, email: undefined as any })
            ).rejects.toThrow(CustomError);
        });

        it("should throw CustomError (400) if password is missing or empty", async () => {
            await expect(
                UserService.register({ ...validPayload, password: "" })
            ).rejects.toThrow(CustomError);

            await expect(
                UserService.register({ ...validPayload, password: undefined as any })
            ).rejects.toThrow(CustomError);
        });

        it("should throw CustomError (400) if password is less than 8 characters", async () => {
            await expect(
                UserService.register({ ...validPayload, password: "short" })
            ).rejects.toThrow(CustomError);
        });

        it("should throw CustomError (409) if email is already registered", async () => {
            jest.spyOn(UserRepository, "findByEmailIncludingInactive").mockResolvedValue({
                _id: validObjectId,
                email: "john.doe@example.com",
            } as any);

            await expect(UserService.register(validPayload)).rejects.toThrow(CustomError);
        });

        it("should throw CustomError (409) on Mongo duplicate key error (code 11000)", async () => {
            jest.spyOn(UserRepository, "findByEmailIncludingInactive").mockResolvedValue(null as any);
            jest.spyOn(bcrypt, "hash").mockImplementation(async () => "hashed_pwd" as any);
            const mongoError = new Error("Duplicate key") as any;
            mongoError.code = 11000;
            jest.spyOn(UserRepository, "create").mockRejectedValue(mongoError);

            await expect(UserService.register(validPayload)).rejects.toThrow(CustomError);
        });

        it("should rethrow unexpected database errors during register", async () => {
            jest.spyOn(UserRepository, "findByEmailIncludingInactive").mockResolvedValue(null as any);
            jest.spyOn(bcrypt, "hash").mockImplementation(async () => "hashed_pwd" as any);
            const genericError = new Error("Database offline");
            jest.spyOn(UserRepository, "create").mockRejectedValue(genericError);

            await expect(UserService.register(validPayload)).rejects.toThrow("Database offline");
        });
    });

    describe("login", () => {
        it("should delegate login to AuthService", async () => {
            const mockAuthResult = {
                message: "Login successful",
                userId: validObjectId,
            };
            jest.spyOn(AuthService, "login").mockResolvedValue(mockAuthResult as any);

            const result = await UserService.login("test@example.com", "password123");

            expect(AuthService.login).toHaveBeenCalledWith("test@example.com", "password123");
            expect(result).toEqual(mockAuthResult);
        });
    });

    describe("getUser", () => {
        it("should return formatted user profile when user exists", async () => {
            const createdAt = new Date("2026-01-01");
            const updatedAt = new Date("2026-01-02");
            jest.spyOn(UserRepository, "findById").mockResolvedValue({
                _id: validObjectId,
                userName: "john_doe",
                email: "john@example.com",
                createdAt,
                updatedAt,
            } as any);

            const result = await UserService.getUser(validObjectId);

            expect(UserRepository.findById).toHaveBeenCalledWith(validObjectId);
            expect(result).toEqual({
                id: validObjectId,
                userName: "john_doe",
                email: "john@example.com",
                createdAt,
                updatedAt,
            });
        });

        it("should throw CustomError (400) if userId is invalid ObjectId", async () => {
            await expect(UserService.getUser("invalid-id")).rejects.toThrow(CustomError);
            await expect(UserService.getUser(123 as any)).rejects.toThrow(CustomError);
        });

        it("should throw CustomError (404) if user is not found", async () => {
            jest.spyOn(UserRepository, "findById").mockResolvedValue(null as any);

            await expect(UserService.getUser(validObjectId)).rejects.toThrow(CustomError);
        });
    });

    describe("updateUser", () => {
        const updatePayload = {
            userName: "new_name",
            email: "newemail@example.com",
        };

        it("should successfully update user profile", async () => {
            const updatedAt = new Date("2026-01-03");
            jest.spyOn(UserRepository, "findByEmail").mockResolvedValue(null as any);
            jest.spyOn(UserRepository, "update").mockResolvedValue({
                _id: validObjectId,
                userName: "new_name",
                email: "newemail@example.com",
                updatedAt,
            } as any);

            const result = await UserService.updateUser(validObjectId, updatePayload);

            expect(UserRepository.findByEmail).toHaveBeenCalledWith("newemail@example.com");
            expect(UserRepository.update).toHaveBeenCalledWith(validObjectId, {
                userName: "new_name",
                email: "newemail@example.com",
            });
            expect(result).toEqual({
                message: "User updated successfully",
                user: {
                    id: validObjectId,
                    userName: "new_name",
                    email: "newemail@example.com",
                    updatedAt,
                },
            });
        });

        it("should throw CustomError (400) if userId is invalid ObjectId", async () => {
            await expect(
                UserService.updateUser("invalid-id", updatePayload)
            ).rejects.toThrow(CustomError);
        });

        it("should throw CustomError (400) if updateData is null or invalid", async () => {
            await expect(
                UserService.updateUser(validObjectId, null as any)
            ).rejects.toThrow(CustomError);
        });

        it("should throw CustomError (400) if userName is not a string or empty after trim", async () => {
            await expect(
                UserService.updateUser(validObjectId, { userName: "   " })
            ).rejects.toThrow(CustomError);

            await expect(
                UserService.updateUser(validObjectId, { userName: 123 as any })
            ).rejects.toThrow(CustomError);
        });

        it("should throw CustomError (400) if email is not a string or empty after trim", async () => {
            await expect(
                UserService.updateUser(validObjectId, { email: "   " })
            ).rejects.toThrow(CustomError);

            await expect(
                UserService.updateUser(validObjectId, { email: 123 as any })
            ).rejects.toThrow(CustomError);
        });

        it("should throw CustomError (409) if email is already in use by another user", async () => {
            jest.spyOn(UserRepository, "findByEmail").mockResolvedValue({
                _id: anotherObjectId,
                email: "newemail@example.com",
            } as any);

            await expect(
                UserService.updateUser(validObjectId, { email: "newemail@example.com" })
            ).rejects.toThrow(CustomError);
        });

        it("should allow email update if email matches current user", async () => {
            const updatedAt = new Date();
            jest.spyOn(UserRepository, "findByEmail").mockResolvedValue({
                _id: validObjectId,
                email: "same@example.com",
            } as any);
            jest.spyOn(UserRepository, "update").mockResolvedValue({
                _id: validObjectId,
                userName: "john",
                email: "same@example.com",
                updatedAt,
            } as any);

            const result = await UserService.updateUser(validObjectId, { email: "same@example.com" });
            expect(result.user.email).toBe("same@example.com");
        });

        it("should throw CustomError (400) if no valid fields provided", async () => {
            await expect(
                UserService.updateUser(validObjectId, {})
            ).rejects.toThrow(CustomError);
        });

        it("should throw CustomError (404) if user not found or inactive during update", async () => {
            jest.spyOn(UserRepository, "update").mockResolvedValue(null as any);

            await expect(
                UserService.updateUser(validObjectId, { userName: "name" })
            ).rejects.toThrow(CustomError);
        });

        it("should throw CustomError (409) on Mongo duplicate key error during update", async () => {
            const mongoError = new Error("Duplicate key") as any;
            mongoError.code = 11000;
            jest.spyOn(UserRepository, "update").mockRejectedValue(mongoError);

            await expect(
                UserService.updateUser(validObjectId, { userName: "name" })
            ).rejects.toThrow(CustomError);
        });

        it("should rethrow unexpected errors during update", async () => {
            jest.spyOn(UserRepository, "update").mockRejectedValue(new Error("DB error"));

            await expect(
                UserService.updateUser(validObjectId, { userName: "name" })
            ).rejects.toThrow("DB error");
        });
    });

    describe("deactivateUser", () => {
        it("should successfully deactivate user account", async () => {
            jest.spyOn(UserRepository, "deactivate").mockResolvedValue({
                _id: validObjectId,
                isActive: false,
            } as any);

            const result = await UserService.deactivateUser(validObjectId);

            expect(UserRepository.deactivate).toHaveBeenCalledWith(validObjectId);
            expect(result).toEqual({
                message: "User deactivated successfully",
            });
        });

        it("should throw CustomError (400) if userId is invalid ObjectId", async () => {
            await expect(UserService.deactivateUser("not-valid")).rejects.toThrow(CustomError);
        });

        it("should throw CustomError (404) if user not found or already inactive", async () => {
            jest.spyOn(UserRepository, "deactivate").mockResolvedValue(null as any);

            await expect(UserService.deactivateUser(validObjectId)).rejects.toThrow(CustomError);
        });
    });

    describe("logout", () => {
        it("should delegate logout to AuthService", async () => {
            const mockLogoutResponse = { message: "Logout successful" };
            jest.spyOn(AuthService, "logout").mockResolvedValue(mockLogoutResponse as any);

            const result = await UserService.logout(validObjectId);

            expect(AuthService.logout).toHaveBeenCalledWith(validObjectId);
            expect(result).toEqual(mockLogoutResponse);
        });
    });
});
