import { PartialType } from "@nestjs/swagger";
import { CreateIntegrityFlagDto } from "./create-integrity-flag.dto";

export class UpdateIntegrityFlagDto extends PartialType(
  CreateIntegrityFlagDto,
) {}
