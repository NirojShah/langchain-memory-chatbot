import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";

import UserRepository from "./user.repository.js";
import type {
    CreateUserDTO,
    UpdateUserDTO,
} from "./user.datatype.js";

class UserService {
    // Register a new user
    async register(userData: CreateUserDTO) {
        const userName = userData.userName?.trim();
        const email = userData.email?.trim().toLowerCase();
        const password = userData.password;

        if (!userName || !email || !password) {
            throw new Error(
                "Username, email, and password are required"
            );
        }

        if (password.length < 8) {
            throw new Error(
                "Password must be at least 8 characters long"
            );
        }

        // Check existing accounts, including inactive accounts.
        const existingUser =
            await UserRepository.findByEmailIncludingInactive(email);

        if (existingUser) {
            throw new Error("Email is already registered");
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        try {
            const user = await UserRepository.create({
                userName,
                email,
                password: hashedPassword,
            });

            return {
                message: "User registered successfully",
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
                throw new Error("Email is already registered");
            }

            throw error;
        }
    }

    // Login an existing user
    async login(email: string, password: string) {
        if (!email?.trim() || !password) {
            throw new Error("Email and password are required");
        }

        const user = await UserRepository.findByEmailForAuth(
            email.trim().toLowerCase()
        );

        if (!user) {
            throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }

        const accessSecret = process.env.JWT_ACCESS_SECRET;

        if (!accessSecret) {
            throw new Error(
                "JWT_ACCESS_SECRET is not configured"
            );
        }

        // Short-lived access token
        const accessToken = jwt.sign(
            {
                sub: user._id.toString(),
            },
            accessSecret,
            {
                expiresIn: "15m",
            }
        );

        // Generate an opaque refresh token.
        // Store only its hash in the database.
        const refreshToken = randomBytes(32).toString("hex");

        const refreshTokenHash = createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        await UserRepository.setRefreshTokenHash(
            user._id.toString(),
            refreshTokenHash
        );

        return {
            message: "Login successful",
            user: {
                id: user._id,
                userName: user.userName,
                email: user.email,
            },
            accessToken,
            refreshToken,
        };
    }

    // Get an active user's profile
    async getUser(userId: string) {
        const user = await UserRepository.findById(userId);

        if (!user) {
            throw new Error("User not found");
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
        const updates: UpdateUserDTO = {};

        if (updateData.userName !== undefined) {
            const userName = updateData.userName.trim();

            if (!userName) {
                throw new Error("Username cannot be empty");
            }

            updates.userName = userName;
        }

        if (updateData.email !== undefined) {
            const email = updateData.email.trim().toLowerCase();

            if (!email) {
                throw new Error("Email cannot be empty");
            }

            const existingUser =
                await UserRepository.findByEmail(email);

            if (
                existingUser &&
                existingUser._id.toString() !== userId
            ) {
                throw new Error("Email is already in use");
            }

            updates.email = email;
        }

        if (Object.keys(updates).length === 0) {
            throw new Error("No valid fields provided for update");
        }

        try {
            const updatedUser = await UserRepository.update(
                userId,
                updates
            );

            if (!updatedUser) {
                throw new Error("User not found or inactive");
            }

            return {
                message: "User updated successfully",
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
                throw new Error("Email is already in use");
            }

            throw error;
        }
    }

    // Deactivate an account
    async deactivateUser(userId: string) {
        const user = await UserRepository.deactivate(userId);

        if (!user) {
            throw new Error("User not found or already inactive");
        }

        return {
            message: "User deactivated successfully",
        };
    }

    // Logout an authenticated user
    async logout(userId: string) {
        await UserRepository.logout(userId);

        return {
            message: "Logout successful",
        };
    }
}

export default new UserService();