import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";
import { AttemptMode } from "../../../../common/enums";

export class AttemptQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by quiz" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quizId?: number;

  @ApiPropertyOptional({ example: 2, description: "Filter by student" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId?: number;

  @ApiPropertyOptional({ example: 1, description: "Filter by exam session" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examSessionId?: number;

  @ApiPropertyOptional({
    example: AttemptMode.HOME,
    enum: AttemptMode,
    description: "home = practice, exam = supervised computer room",
  })
  @IsOptional()
  @IsEnum(AttemptMode)
  mode?: AttemptMode;
}
