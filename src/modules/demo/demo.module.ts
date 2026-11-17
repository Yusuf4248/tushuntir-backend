import { Module } from "@nestjs/common";
import { DemoController } from "./demo.controller";
import { DemoWeekJob } from "./demo-week.job";
import { DemoService } from "./demo.service";

@Module({
  controllers: [DemoController],
  providers: [DemoService, DemoWeekJob],
})
export class DemoModule {}
