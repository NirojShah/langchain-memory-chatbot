import { Container, type ResolutionContext } from "inversify";
import { MessageController } from "./message.controller.js";
import { MessageRepository } from "./message.repository.js";
import { MessageService } from "./message.service.js";

const messageContainer = new Container();

messageContainer
    .bind(MessageRepository)
    .toDynamicValue(() => new MessageRepository())
    .inSingletonScope();

messageContainer
    .bind(MessageService)
    .toDynamicValue((context: ResolutionContext) => new MessageService(context.get(MessageRepository)))
    .inSingletonScope();

messageContainer
    .bind(MessageController)
    .toDynamicValue((context: ResolutionContext) => new MessageController(context.get(MessageService)))
    .inSingletonScope();

export { messageContainer };
