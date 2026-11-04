import type { FastifyReply, FastifyRequest } from "fastify";

import UserService from "./user.service.js";
import type {
    CreateUserDTO,
    UpdateUserDTO,
} from "./user.datatype.js";
import { CustomError } from "../../utility/customError.js";
import AuthService from "../../auth/auth.service.js";

class UserController {
    register = async (
        request: FastifyRequest<{ Body: CreateUserDTO }>,
        reply: FastifyReply
    ) => {
        const result = await UserService.register(request.body);
        return reply.code(201).send(result);
    };

    login = async (
        request: FastifyRequest<{
            Body: Pick<CreateUserDTO, "email" | "password">;
        }>,
        reply: FastifyReply
    ) => {
        const { email, password } = request.body;
        const result = await UserService.login(email, password);
        return reply.send(result);
    };

    getMe = async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = this.getAuthenticatedUserId(request);
        const result = await UserService.getUser(userId);
        return reply.send(result);
    };

    updateMe = async (
        request: FastifyRequest<{ Body: UpdateUserDTO }>,
        reply: FastifyReply
    ) => {
        const userId: string = this.getAuthenticatedUserId(request);
        const result = await UserService.updateUser(userId, request.body);
        return reply.send(result);
    };

    deactivateMe = async (request: FastifyRequest, reply: FastifyReply) => {
        const userId: string = this.getAuthenticatedUserId(request);
        const result = await UserService.deactivateUser(userId);
        return reply.send(result);
    };

    logout = async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = this.getAuthenticatedUserId(request);
        const result = await UserService.logout(userId);
        return reply.send(result);
    };

    private getAuthenticatedUserId(request: FastifyRequest) {
        const authorization = request.headers.authorization;
        const token = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];

        if (!token) {
            throw CustomError.unauthorized("Bearer access token is required");
        }

        return AuthService.verifyAccessToken(token);
    }
}

export default new UserController();