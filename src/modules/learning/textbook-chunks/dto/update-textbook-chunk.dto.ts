import { PartialType } from "@nestjs/swagger";
import { CreateTextbookChunkDto } from "./create-textbook-chunk.dto";

export class UpdateTextbookChunkDto extends PartialType(
  CreateTextbookChunkDto,
) {}
