import type { FastifyPluginAsync } from "fastify";
import type {
    CreateUserDTO,
    UpdateUserDTO,
} from "./user.datatype.js";
import UserController from "./user.controller.js";
import { loginSchema, registerSchema, updateSchema } from "./user.validation.js";

const userRoutes: FastifyPluginAsync = async (app) => {
    app.post<{ Body: CreateUserDTO }>(
        "/register",
        { schema: { body: registerSchema } },
        UserController.register
    );

    app.post<{ Body: Pick<CreateUserDTO, "email" | "password"> }>(
        "/login",
        { schema: { body: loginSchema } },
        UserController.login
    );

    app.get("/me", UserController.getMe);

    app.patch<{ Body: UpdateUserDTO }>(
        "/me",
        { schema: { body: updateSchema } },
        UserController.updateMe
    );

    app.delete("/me", UserController.deactivateMe);
    app.post("/logout", UserController.logout);
};

export default userRoutes;