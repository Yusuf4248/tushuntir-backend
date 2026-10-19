import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../../../common/dto/pagination-query.dto";

export class SubjectQueryDto extends PaginationQueryDto {}
