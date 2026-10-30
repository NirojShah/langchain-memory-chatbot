import bcrypt from "bcrypt";
import type UserRepository from "../user/user.repository.js";

class AuthService {
    constructor(
        private readonly userRepository: typeof UserRepository
    ) { }

    // Login
    async login(email: string, password: string) {
        const user = await this.userRepository.findByEmailForAuth(email);

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

        // Generate access and refresh tokens here.

        return {
            message: "Login successful",
            userId: user._id,
        };
    }

    // Logout
    async logout(userId: string) {
        await this.userRepository.logout(userId);
        return {
            message: "Logout successful",
        };
    }
}

export default AuthService;