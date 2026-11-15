import mongoose, { Schema, type Model } from "mongoose";
import type { IUser } from "./user.datatype.js";

const userSchema = new Schema<IUser>(
    {
        userName: {
            type: String,
            required: [true, "Username is required"],
            trim: true,
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [
                8,
                "Password must be at least 8 characters long",
            ],
            select: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        refreshTokenHash: {
            type: String,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

const User: Model<IUser> =
    mongoose.models.User ||
    mongoose.model<IUser>("User", userSchema);

export default User;