import { ApiProperty } from "@nestjs/swagger";
import { User } from "../../users/entities/user.entity";

export class TokenResponseDto {
  @ApiProperty({ example: "Bearer" })
  tokenType: "Bearer";

  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  accessToken: string;

  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  refreshToken: string;

  @ApiProperty({
    example: "15m",
    description: "Access token lifetime (JWT_ACCESS_TTL)",
  })
  expiresIn: string;

  @ApiProperty({ type: () => User })
  user: User;
}
