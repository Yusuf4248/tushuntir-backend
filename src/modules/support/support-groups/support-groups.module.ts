import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SupportGroup } from "./entities/support-group.entity";
import { SupportGroupsController } from "./support-groups.controller";
import { SupportGroupsService } from "./support-groups.service";

@Module({
  imports: [TypeOrmModule.forFeature([SupportGroup])],
  controllers: [SupportGroupsController],
  providers: [SupportGroupsService],
  exports: [SupportGroupsService],
})
export class SupportGroupsModule {}
