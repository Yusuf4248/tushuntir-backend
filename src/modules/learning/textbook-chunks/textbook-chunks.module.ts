import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TextbookChunk } from "./entities/textbook-chunk.entity";
import { TextbookChunksController } from "./textbook-chunks.controller";
import { TextbookChunksService } from "./textbook-chunks.service";

@Module({
  imports: [TypeOrmModule.forFeature([TextbookChunk])],
  controllers: [TextbookChunksController],
  providers: [TextbookChunksService],
  exports: [TextbookChunksService],
})
export class TextbookChunksModule {}
