export interface IUser {
    userName: string;
    email: string;
    password: string;
    isActive: boolean;
    refreshTokenHash?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type CreateUserDTO = Pick<
    IUser,
    "userName" | "email" | "password"
>;

export type UpdateUserDTO = Partial<
    Pick<IUser, "userName" | "email">
>;