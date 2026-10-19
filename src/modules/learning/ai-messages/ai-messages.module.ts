import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AiMessage } from "./entities/ai-message.entity";
import { AiMessagesController } from "./ai-messages.controller";
import { AiMessagesService } from "./ai-messages.service";

@Module({
  imports: [TypeOrmModule.forFeature([AiMessage])],
  controllers: [AiMessagesController],
  providers: [AiMessagesService],
  exports: [AiMessagesService],
})
export class AiMessagesModule {}
