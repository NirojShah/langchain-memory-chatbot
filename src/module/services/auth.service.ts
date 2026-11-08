import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createHash, randomBytes } from "node:crypto";
import UserRepository from "../user/user.repository.js";
import { CustomError } from "../../utility/customError.js";

class AuthService {
    constructor(
        private readonly userRepository: typeof UserRepository
    ) {}

    // Login
    async login(email: string, password: string) {
        if (
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            throw CustomError.badRequest("Email and password are required");
        }

        const user = await this.userRepository.findByEmailForAuth(
            email.trim().toLowerCase()
        );

        if (!user) {
            throw CustomError.unauthorized("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            throw CustomError.unauthorized("Invalid email or password");
        }

        const accessSecret = process.env.JWT_ACCESS_SECRET;

        if (!accessSecret) {
            throw new Error("JWT_ACCESS_SECRET is not configured");
        }

        const accessToken = jwt.sign(
            { sub: user._id.toString() },
            accessSecret,
            { expiresIn: "15m" }
        );

        const refreshToken = randomBytes(32).toString("hex");
        const refreshTokenHash = createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        const updatedUser = await this.userRepository.setRefreshTokenHash(
            user._id.toString(),
            refreshTokenHash
        );

        if (!updatedUser) {
            throw CustomError.unauthorized("Invalid email or password");
        }

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

    verifyAccessToken(token: string) {
        const accessSecret = process.env.JWT_ACCESS_SECRET;

        if (!accessSecret) {
            throw new Error("JWT_ACCESS_SECRET is not configured");
        }

        let payload: string | jwt.JwtPayload;

        try {
            payload = jwt.verify(token, accessSecret);
        } catch {
            throw CustomError.unauthorized("Invalid or expired access token");
        }

        if (
            typeof payload === "string" ||
            typeof payload.sub !== "string" ||
            !mongoose.isValidObjectId(payload.sub)
        ) {
            throw CustomError.unauthorized("Invalid or expired access token");
        }

        return payload.sub;
    }

    // Logout
    async logout(userId: string) {
        if (
            typeof userId !== "string" ||
            !mongoose.isValidObjectId(userId)
        ) {
            throw CustomError.badRequest("Invalid user ID");
        }

        await this.userRepository.logout(userId);
        return {
            message: "Logout successful",
        };
    }
}

export default new AuthService(UserRepository);
