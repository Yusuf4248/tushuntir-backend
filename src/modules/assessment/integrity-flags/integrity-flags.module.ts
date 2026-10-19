import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IntegrityFlag } from "./entities/integrity-flag.entity";
import { IntegrityFlagsController } from "./integrity-flags.controller";
import { IntegrityFlagsService } from "./integrity-flags.service";

@Module({
  imports: [TypeOrmModule.forFeature([IntegrityFlag])],
  controllers: [IntegrityFlagsController],
  providers: [IntegrityFlagsService],
  exports: [IntegrityFlagsService],
})
export class IntegrityFlagsModule {}
