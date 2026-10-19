import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TopicMastery } from "./entities/topic-mastery.entity";
import { TopicMasteryController } from "./topic-mastery.controller";
import { TopicMasteryService } from "./topic-mastery.service";

@Module({
  imports: [TypeOrmModule.forFeature([TopicMastery])],
  controllers: [TopicMasteryController],
  providers: [TopicMasteryService],
  exports: [TopicMasteryService],
})
export class TopicMasteryModule {}
