import type { IUser } from "./user.datatype.js";
import User from "./user.model.js";

class UserRepository {
    // Create a new user
    async create(userData: Partial<IUser>) {
        return await User.create(userData);
    }

    // Find a user by email
    async findByEmail(email: string) {
        return await User.findOne({
            email: email.toLowerCase(),
            isActive: true,
        });
    }
}

export default new UserRepository();