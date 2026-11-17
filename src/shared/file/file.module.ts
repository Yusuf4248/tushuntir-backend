import { Module } from "@nestjs/common";
import { FileLinksService } from "./file-links.service";
import { FileService } from "./file.service";

@Module({
  providers: [FileService, FileLinksService],
  exports: [FileService, FileLinksService],
})
export class FileModule {}
