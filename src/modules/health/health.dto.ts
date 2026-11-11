import { ApiProperty } from "@nestjs/swagger";

export class HealthDto {
  @ApiProperty({ enum: ["ok", "error"], example: "ok" })
  status: "ok" | "error";

  @ApiProperty({ example: true, description: "The database answered" })
  database: boolean;

  @ApiProperty({
    example: true,
    description: "The pgvector extension is installed",
  })
  vector: boolean;
}
