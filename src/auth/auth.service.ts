import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userRepository, { type UserRepository as UserRepositoryType } from "../module/user/user.repository.js";
import { CustomError } from "../utility/customError.js";

class AuthService {
    private readonly userRepository: UserRepositoryType = userRepository;
    constructor() { }

    // Login
    async login(email: string, password: string) {
        if (!email?.trim() || !password) {
            throw CustomError.badRequest("Email and password are required");
        }

        const user = await this.userRepository.findByEmailForAuth(email.trim().toLowerCase());

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
        const accessToken = accessSecret
            ? jwt.sign({ sub: user._id.toString() }, accessSecret, { expiresIn: "15m" })
            : undefined;

        return {
            message: "Login successful",
            user: {
                id: user._id,
                userName: user.userName,
                email: user.email,
            },
            ...(accessToken ? { accessToken } : {}),
            userId: user._id,
        };
    }

    async verifyAccessToken(token: string): Promise<string> {
        const accessSecret = process.env.JWT_ACCESS_SECRET;
        if (!accessSecret) {
            throw CustomError.internal("JWT_ACCESS_SECRET is not configured");
        }

        try {
            const decoded = jwt.verify(token, accessSecret) as { sub?: string; userId?: string } | string;
            if (typeof decoded === "string") {
                return decoded;
            }
            const userId = decoded.sub || decoded.userId;
            if (!userId) {
                throw CustomError.unauthorized("Invalid access token");
            }
            return userId;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.unauthorized("Invalid or expired access token");
        }
    }

    async logout(userId: string) {
        await this.userRepository.logout(userId);
        return {
            message: "Logout successful",
        };
    }
}

export default new AuthService();
