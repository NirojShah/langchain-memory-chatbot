import { Container } from "inversify";
import { ChatController } from "./chat.controller.js";
import { ChatRepository } from "./chat.repository.js";
import { ChatService } from "./chat.service.js";

const chatContainer = new Container();

chatContainer
    .bind(ChatRepository)
    .toDynamicValue(() => new ChatRepository())
    .inSingletonScope();

chatContainer
    .bind(ChatService)
    .toDynamicValue((context) => new ChatService(context.get(ChatRepository)))
    .inSingletonScope();

chatContainer
    .bind(ChatController)
    .toDynamicValue((context) => new ChatController(context.get(ChatService)))
    .inSingletonScope();

export { chatContainer };
