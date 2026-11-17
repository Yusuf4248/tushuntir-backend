import { Module } from "@nestjs/common";
import { FileModule } from "../../shared/file/file.module";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";

@Module({
  imports: [FileModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
