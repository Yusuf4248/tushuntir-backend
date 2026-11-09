import { Module } from "@nestjs/common";
import { LessonsModule } from "../daily/lessons/lessons.module";
import { DemoController } from "./demo.controller";
import { DemoService } from "./demo.service";

@Module({
  imports: [LessonsModule],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
