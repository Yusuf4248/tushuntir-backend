import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Attempt } from "./entities/attempt.entity";
import { AttemptsController } from "./attempts.controller";
import { AttemptsService } from "./attempts.service";

@Module({
  imports: [TypeOrmModule.forFeature([Attempt])],
  controllers: [AttemptsController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
