import { jest } from "@jest/globals";
import UserRepository from "./user.repository.js";
import User from "./user.model.js";

describe("UserRepository", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("create", () => {
        it("should call User.create with userData and return the user", async () => {
            const userData = {
                userName: "testuser",
                email: "test@example.com",
                password: "hashedpassword",
            };
            const mockCreated = { _id: "64f1a2b3c4d5e6f7a8b9c0d1", ...userData };
            jest.spyOn(User, "create").mockResolvedValue(mockCreated as any);

            const result = await UserRepository.create(userData);

            expect(User.create).toHaveBeenCalledWith(userData);
            expect(result).toEqual(mockCreated);
        });
    });

    describe("findByEmail", () => {
        it("should find active user by lowercased email", async () => {
            const mockUser = {
                _id: "64f1a2b3c4d5e6f7a8b9c0d1",
                email: "test@example.com",
                isActive: true,
            };
            jest.spyOn(User, "findOne").mockResolvedValue(mockUser as any);

            const result = await UserRepository.findByEmail("TEST@Example.com");

            expect(User.findOne).toHaveBeenCalledWith({
                email: "test@example.com",
                isActive: true,
            });
            expect(result).toEqual(mockUser);
        });
    });

    describe("findByEmailForAuth", () => {
        it("should find active user and include password field", async () => {
            const mockSelect = (jest.fn() as any).mockResolvedValue({
                _id: "64f1a2b3c4d5e6f7a8b9c0d1",
                email: "test@example.com",
                password: "hashedpassword",
            });

            jest.spyOn(User, "findOne").mockReturnValue({
                select: mockSelect,
            } as any);

            const result = await UserRepository.findByEmailForAuth("TEST@Example.com");

            expect(User.findOne).toHaveBeenCalledWith({
                email: "test@example.com",
                isActive: true,
            });
            expect(mockSelect).toHaveBeenCalledWith("+password");
            expect(result).toEqual({
                _id: "64f1a2b3c4d5e6f7a8b9c0d1",
                email: "test@example.com",
                password: "hashedpassword",
            });
        });
    });

    describe("findById", () => {
        it("should find active user by ID", async () => {
            const mockUser = {
                _id: "64f1a2b3c4d5e6f7a8b9c0d1",
                userName: "testuser",
                isActive: true,
            };
            jest.spyOn(User, "findOne").mockResolvedValue(mockUser as any);

            const result = await UserRepository.findById("64f1a2b3c4d5e6f7a8b9c0d1");

            expect(User.findOne).toHaveBeenCalledWith({
                _id: "64f1a2b3c4d5e6f7a8b9c0d1",
                isActive: true,
            });
            expect(result).toEqual(mockUser);
        });
    });

    describe("update", () => {
        it("should find and update active user with validation", async () => {
            const updateData = { userName: "updated_name" };
            const mockUpdatedUser = {
                _id: "64f1a2b3c4d5e6f7a8b9c0d1",
                userName: "updated_name",
            };
            jest.spyOn(User, "findOneAndUpdate").mockResolvedValue(mockUpdatedUser as any);

            const result = await UserRepository.update("64f1a2b3c4d5e6f7a8b9c0d1", updateData);

            expect(User.findOneAndUpdate).toHaveBeenCalledWith(
                {
                    _id: "64f1a2b3c4d5e6f7a8b9c0d1",
                    isActive: true,
                },
                {
                    $set: updateData,
                },
                {
                    new: true,
                    runValidators: true,
                }
            );
            expect(result).toEqual(mockUpdatedUser);
        });
    });

    describe("deactivate", () => {
        it("should soft delete by setting isActive to false", async () => {
            const mockDeactivated = {
                _id: "64f1a2b3c4d5e6f7a8b9c0d1",
                isActive: false,
            };
            jest.spyOn(User, "findOneAndUpdate").mockResolvedValue(mockDeactivated as any);

            const result = await UserRepository.deactivate("64f1a2b3c4d5e6f7a8b9c0d1");

            expect(User.findOneAndUpdate).toHaveBeenCalledWith(
                {
                    _id: "64f1a2b3c4d5e6f7a8b9c0d1",
                    isActive: true,
                },
                {
                    $set: { isActive: false },
                },
                {
                    new: true,
                }
            );
            expect(result).toEqual(mockDeactivated);
        });
    });

    describe("findByEmailIncludingInactive", () => {
        it("should find user by email including inactive and select email field", async () => {
            const mockSelect = (jest.fn() as any).mockResolvedValue({
                _id: "64f1a2b3c4d5e6f7a8b9c0d1",
                email: "inactive@example.com",
                isActive: false,
            });

            jest.spyOn(User, "findOne").mockReturnValue({
                select: mockSelect,
            } as any);

            const result = await UserRepository.findByEmailIncludingInactive("inactive@example.com");

            expect(User.findOne).toHaveBeenCalledWith({
                email: "inactive@example.com",
            });
            expect(mockSelect).toHaveBeenCalledWith("+email");
            expect(result).toEqual({
                _id: "64f1a2b3c4d5e6f7a8b9c0d1",
                email: "inactive@example.com",
                isActive: false,
            });
        });
    });

    describe("logout", () => {
        it("should unset refreshToken field for user", async () => {
            const mockResult = {
                _id: "64f1a2b3c4d5e6f7a8b9c0d1",
            };
            jest.spyOn(User, "findOneAndUpdate").mockResolvedValue(mockResult as any);

            const result = await UserRepository.logout("64f1a2b3c4d5e6f7a8b9c0d1");

            expect(User.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: "64f1a2b3c4d5e6f7a8b9c0d1" },
                {
                    $unset: { refreshToken: 1 },
                },
                { new: true }
            );
            expect(result).toEqual(mockResult);
        });
    });
});
