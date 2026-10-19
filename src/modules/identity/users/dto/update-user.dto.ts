import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateUserDto } from "./create-user.dto";

/** role and password never change through PATCH; see PATCH /users/:id/password. */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ["role", "password"] as const),
) {}
