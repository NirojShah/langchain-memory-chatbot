import bcrypt from "bcrypt";
import userRepository, { type UserRepository as UserRepositoryType } from "../module/user/user.repository.js";

class AuthService {
    private readonly userRepository: UserRepositoryType = userRepository
    constructor() { }

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

    async verifyAccessToken(token: string){

    }

    async logout(userId: string){
        
    }
}

export default new AuthService();