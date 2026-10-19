import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { AuthUser } from "../../../common/auth/auth-user";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { ADMIN_PANEL_ROLES } from "../../../common/enums";
import {
  ApiErrorResponses,
  ApiPaginatedResponse,
} from "../../../common/swagger/api-responses.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { SetPasswordDto } from "./dto/set-password.dto";
import { UserQueryDto } from "./dto/user-query.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";

@ApiTags("Identity · Users")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: "Create a user" })
  @ApiCreatedResponse({ type: User })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    return this.usersService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List users" })
  @ApiPaginatedResponse(User)
  findAll(@Query() query: UserQueryDto, @CurrentUser() user: AuthUser) {
    return this.usersService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a user" })
  @ApiOkResponse({ type: User })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a user" })
  @ApiOkResponse({ type: User })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a user" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.usersService.remove(id, user);
  }

  @Patch(":id/password")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Reset a user's password (admin)",
    description:
      "Also ends the user's refresh session, so they must log in again.",
  })
  @ApiNoContentResponse({ description: "Password changed" })
  setPassword(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: SetPasswordDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.setPassword(id, dto.password, user);
  }
}
