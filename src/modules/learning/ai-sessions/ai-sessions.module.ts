import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AiSession } from "./entities/ai-session.entity";
import { AiSessionsController } from "./ai-sessions.controller";
import { AiSessionsService } from "./ai-sessions.service";

@Module({
  imports: [TypeOrmModule.forFeature([AiSession])],
  controllers: [AiSessionsController],
  providers: [AiSessionsService],
  exports: [AiSessionsService],
})
export class AiSessionsModule {}
