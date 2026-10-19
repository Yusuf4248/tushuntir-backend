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
import { CreateAttemptAnswerDto } from "./dto/create-attempt-answer.dto";
import { AttemptAnswerQueryDto } from "./dto/attempt-answer-query.dto";
import { UpdateAttemptAnswerDto } from "./dto/update-attempt-answer.dto";
import { AttemptAnswer } from "./entities/attempt-answer.entity";
import { AttemptAnswersService } from "./attempt-answers.service";

@ApiTags("Learning · Attempt answers")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("attempt-answers")
export class AttemptAnswersController {
  constructor(private readonly attemptAnswersService: AttemptAnswersService) {}

  @Post()
  @ApiOperation({ summary: "Create an attempt answer" })
  @ApiCreatedResponse({ type: AttemptAnswer })
  create(@Body() dto: CreateAttemptAnswerDto, @CurrentUser() user: AuthUser) {
    return this.attemptAnswersService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List attempt answers" })
  @ApiPaginatedResponse(AttemptAnswer)
  findAll(
    @Query() query: AttemptAnswerQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attemptAnswersService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an attempt answer" })
  @ApiOkResponse({ type: AttemptAnswer })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attemptAnswersService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an attempt answer" })
  @ApiOkResponse({ type: AttemptAnswer })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateAttemptAnswerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attemptAnswersService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an attempt answer" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.attemptAnswersService.remove(id, user);
  }
}
