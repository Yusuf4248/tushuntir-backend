import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, Min } from "class-validator";

export class CreateAttachmentDto {
  @ApiProperty({ example: 1, description: "Media file id" })
  @IsInt()
  @Min(1)
  mediaFileId: number;

  @ApiProperty({
    example: "homework",
    enum: ["homework", "submission", "lesson", "topic", "user"],
  })
  @IsIn(["homework", "submission", "lesson", "topic", "user"])
  entityType: string;

  @ApiProperty({
    example: 1,
    description: "Id of that homework / submission / lesson / topic / user",
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  entityId: number;
}
