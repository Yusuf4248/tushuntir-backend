import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

export class AttachmentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by media file" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  mediaFileId?: number;

  @ApiPropertyOptional({
    example: "homework",
    enum: ["homework", "submission", "lesson", "topic", "user"],
  })
  @IsOptional()
  @IsIn(["homework", "submission", "lesson", "topic", "user"])
  entityType?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Id of that homework / submission / lesson / topic / user",
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  entityId?: number;
}
