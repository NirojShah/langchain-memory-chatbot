import { Container } from "inversify";
import { AuthService as AccessTokenServiceType } from "../../auth/auth.service.js";
import { AuthService } from "../services/auth.service.js";
import { UserController } from "./user.controller.js";
import UserRepositoryInstance, { UserRepository } from "./user.repository.js";
import { UserService } from "./user.service.js";

const userContainer = new Container();

userContainer
    .bind(UserRepository)
    .toConstantValue(UserRepositoryInstance);

userContainer
    .bind(AuthService)
    .toDynamicValue((context) => new AuthService(context.get(UserRepository)))
    .inSingletonScope();

userContainer
    .bind(AccessTokenServiceType)
    .toDynamicValue((context) => new AccessTokenServiceType(context.get(UserRepository)))
    .inSingletonScope();

userContainer
    .bind(UserService)
    .toDynamicValue((context) => new UserService(
        context.get(UserRepository),
        context.get(AuthService)
    ))
    .inSingletonScope();

userContainer
    .bind(UserController)
    .toDynamicValue((context) => new UserController(
        context.get(UserService),
        context.get(AccessTokenServiceType)
    ))
    .inSingletonScope();

export { userContainer };
