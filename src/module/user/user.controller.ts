import type { FastifyReply, FastifyRequest } from "fastify";

import UserServiceInstance, { UserService } from "./user.service.js";
import type {
    CreateUserDTO,
    UpdateUserDTO,
} from "./user.datatype.js";
import { CustomError } from "../../utility/customError.js";
import AccessTokenServiceInstance, { AuthService as AccessTokenService } from "../../auth/auth.service.js";
import { CREATED, OK } from "../../utility/statusCodes.js";

class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly accessTokenService: AccessTokenService
    ) { }

    register = async (
        request: FastifyRequest<{ Body: CreateUserDTO }>,
        reply: FastifyReply
    ) => {
        const result = await this.userService.register(request.body);
        return reply.code(CREATED.code).send(result);
    };

    login = async (
        request: FastifyRequest<{
            Body: Pick<CreateUserDTO, "email" | "password">;
        }>,
        reply: FastifyReply
    ) => {
        const { email, password } = request.body;
        const result = await this.userService.login(email, password);
        return reply.code(OK.code).send(result);
    };

    getMe = async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = await this.getAuthenticatedUserId(request);
        const result = await this.userService.getUser(userId);
        return reply.code(OK.code).send(result);
    };

    updateMe = async (
        request: FastifyRequest<{ Body: UpdateUserDTO }>,
        reply: FastifyReply
    ) => {
        const userId: string = await this.getAuthenticatedUserId(request);
        const result = await this.userService.updateUser(userId, request.body);
        return reply.code(OK.code).send(result);
    };

    deactivateMe = async (request: FastifyRequest, reply: FastifyReply) => {
        const userId: string = await this.getAuthenticatedUserId(request);
        const result = await this.userService.deactivateUser(userId);
        return reply.code(OK.code).send(result);
    };

    logout = async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = await this.getAuthenticatedUserId(request);
        const result = await this.userService.logout(userId);
        return reply.code(OK.code).send(result);
    };

    private async getAuthenticatedUserId(request: FastifyRequest): Promise<string> {
        const authorization = request.headers.authorization;
        const token = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];

        if (!token) {
            throw CustomError.unauthorized("Bearer access token is required");
        }

        return await this.accessTokenService.verifyAccessToken(token);
    }
}

export default new UserController(UserServiceInstance, AccessTokenServiceInstance);
export { UserController };