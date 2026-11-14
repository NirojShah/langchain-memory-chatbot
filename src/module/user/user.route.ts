import type { FastifyPluginAsync } from "fastify";
import type {
    CreateUserDTO,
    UpdateUserDTO,
} from "./user.datatype.js";
import { userContainer } from "./user.container.js";
import { UserController } from "./user.controller.js";
import {
    loginSchema,
    registerSchema,
    updateSchema,
} from "./user.validation.js";

const userController = userContainer.get(UserController);

const userRoutes: FastifyPluginAsync = async (app) => {
    app.post<{ Body: CreateUserDTO }>(
        "/register",
        { schema: { body: registerSchema } },
        userController.register
    );

    app.post<{ Body: Pick<CreateUserDTO, "email" | "password"> }>(
        "/login",
        { schema: { body: loginSchema } },
        userController.login
    );

    app.get("/me", userController.getMe);

    app.patch<{ Body: UpdateUserDTO }>(
        "/me",
        { schema: { body: updateSchema } },
        userController.updateMe
    );

    app.delete("/me", userController.deactivateMe);
    app.post("/logout", userController.logout);
};

export default userRoutes;