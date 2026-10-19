import { ApiProperty } from "@nestjs/swagger";

export class PaginatedMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 57 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

/** The one paginated response shape used by every list endpoint. */
export interface Paginated<T> {
  data: T[];
  meta: PaginatedMetaDto;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: "Class 12 not found" })
  message: string | string[];

  @ApiProperty({ example: "Not Found", required: false })
  error?: string;

  @ApiProperty({ example: "/api/classes/12" })
  path: string;

  @ApiProperty({ example: "2026-10-19T08:00:00.000Z" })
  timestamp: string;
}
