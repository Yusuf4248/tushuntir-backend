import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileModule } from "../../../shared/file/file.module";
import { MediaFile } from "./entities/media-file.entity";
import { MediaFilesController } from "./media-files.controller";
import { MediaFilesService } from "./media-files.service";

@Module({
  imports: [TypeOrmModule.forFeature([MediaFile]), FileModule],
  controllers: [MediaFilesController],
  providers: [MediaFilesService],
  exports: [MediaFilesService],
})
export class MediaFilesModule {}
