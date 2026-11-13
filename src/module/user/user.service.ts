import bcrypt from "bcrypt";
import mongoose from "mongoose";

import UserRepository from "./user.repository.js";
import AuthService from "../services/auth.service.js";
import type {
    CreateUserDTO,
    UpdateUserDTO,
} from "./user.datatype.js";
import { CustomError } from "../../utility/customError.js";
import { STATUS_MESSAGES } from "../../utility/statusCodes.js";

class UserService {
    // Register a new user
    async register(userData: CreateUserDTO) {
        const userName =
            typeof userData?.userName === "string"
                ? userData.userName.trim()
                : "";
        const email =
            typeof userData?.email === "string"
                ? userData.email.trim().toLowerCase()
                : "";
        const password =
            typeof userData?.password === "string"
                ? userData.password
                : "";

        if (!userName || !email || !password) {
            throw CustomError.badRequest(
                "Username, email, and password are required"
            );
        }

        if (password.length < 8) {
            throw CustomError.badRequest(
                "Password must be at least 8 characters long"
            );
        }

        // Check existing accounts, including inactive accounts.
        const existingUser =
            await UserRepository.findByEmailIncludingInactive(email);

        if (existingUser) {
            throw CustomError.conflict("Email is already registered");
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        try {
            const user = await UserRepository.create({
                userName,
                email,
                password: hashedPassword,
            });

            return {
                message: STATUS_MESSAGES.USER_REGISTERED,
                user: {
                    id: user._id,
                    userName: user.userName,
                    email: user.email,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                },
            };
        } catch (error: unknown) {
            // The unique MongoDB index is the final protection
            // against concurrent duplicate registrations.
            if (
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === 11000
            ) {
                throw CustomError.conflict("Email is already registered");
            }

            throw error;
        }
    }

    // Login an existing user
    async login(email: string, password: string) {
        return AuthService.login(email, password);
    }

    // Get an active user's profile
    async getUser(userId: string) {
        this.assertValidUserId(userId);
        const user = await UserRepository.findById(userId);

        if (!user) {
            throw CustomError.notFound("User not found");
        }

        return {
            id: user._id,
            userName: user.userName,
            email: user.email,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    // Update an active user's profile
    async updateUser(
        userId: string,
        updateData: UpdateUserDTO
    ) {
        this.assertValidUserId(userId);
        if (!updateData || typeof updateData !== "object") {
            throw CustomError.badRequest("Invalid user update");
        }

        const updates: UpdateUserDTO = {};

        if (updateData.userName !== undefined) {
            if (typeof updateData.userName !== "string") {
                throw CustomError.badRequest("Invalid username");
            }

            const userName = updateData.userName.trim();

            if (!userName) {
                throw CustomError.badRequest("Username cannot be empty");
            }

            updates.userName = userName;
        }

        if (updateData.email !== undefined) {
            if (typeof updateData.email !== "string") {
                throw CustomError.badRequest("Invalid email");
            }

            const email = updateData.email.trim().toLowerCase();

            if (!email) {
                throw CustomError.badRequest("Email cannot be empty");
            }

            const existingUser =
                await UserRepository.findByEmail(email);

            if (
                existingUser &&
                existingUser._id.toString() !== userId.toLowerCase()
            ) {
                throw CustomError.conflict("Email is already in use");
            }

            updates.email = email;
        }

        if (Object.keys(updates).length === 0) {
            throw CustomError.badRequest(
                "No valid fields provided for update"
            );
        }

        try {
            const updatedUser = await UserRepository.update(
                userId,
                updates
            );

            if (!updatedUser) {
                throw CustomError.notFound("User not found or inactive");
            }

            return {
                message: STATUS_MESSAGES.USER_UPDATED,
                user: {
                    id: updatedUser._id,
                    userName: updatedUser.userName,
                    email: updatedUser.email,
                    updatedAt: updatedUser.updatedAt,
                },
            };
        } catch (error: unknown) {
            if (
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === 11000
            ) {
                throw CustomError.conflict("Email is already in use");
            }

            throw error;
        }
    }

    // Deactivate an account
    async deactivateUser(userId: string) {
        this.assertValidUserId(userId);
        const user = await UserRepository.deactivate(userId);

        if (!user) {
            throw CustomError.notFound(
                "User not found or already inactive"
            );
        }

        return {
            message: STATUS_MESSAGES.USER_DEACTIVATED,
        };
    }

    // Logout an authenticated user
    async logout(userId: string) {
        return AuthService.logout(userId);
    }

    private assertValidUserId(userId: string) {
        if (
            typeof userId !== "string" ||
            !mongoose.isValidObjectId(userId)
        ) {
            throw CustomError.badRequest("Invalid user ID");
        }
    }
}

export default new UserService();