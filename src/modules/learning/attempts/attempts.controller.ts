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
import { CreateAttemptDto } from "./dto/create-attempt.dto";
import { AttemptQueryDto } from "./dto/attempt-query.dto";
import { UpdateAttemptDto } from "./dto/update-attempt.dto";
import { Attempt } from "./entities/attempt.entity";
import { AttemptsService } from "./attempts.service";

@ApiTags("Learning · Attempts")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("attempts")
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post()
  @ApiOperation({ summary: "Create an attempt" })
  @ApiCreatedResponse({ type: Attempt })
  create(@Body() dto: CreateAttemptDto, @CurrentUser() user: AuthUser) {
    return this.attemptsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List attempts" })
  @ApiPaginatedResponse(Attempt)
  findAll(@Query() query: AttemptQueryDto, @CurrentUser() user: AuthUser) {
    return this.attemptsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an attempt" })
  @ApiOkResponse({ type: Attempt })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attemptsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an attempt" })
  @ApiOkResponse({ type: Attempt })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateAttemptDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attemptsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an attempt" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.attemptsService.remove(id, user);
  }
}
