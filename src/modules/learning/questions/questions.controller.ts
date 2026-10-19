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
import { ADMIN_PANEL_ROLES, UserRole } from "../../../common/enums";
import {
  ApiErrorResponses,
  ApiPaginatedResponse,
} from "../../../common/swagger/api-responses.decorator";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { ReviewQuestionDto } from "./dto/review-question.dto";
import { QuestionQueryDto } from "./dto/question-query.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { Question } from "./entities/question.entity";
import { QuestionsService } from "./questions.service";

@ApiTags("Learning · Questions")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("questions")
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Create a question" })
  @ApiCreatedResponse({ type: Question })
  create(@Body() dto: CreateQuestionDto, @CurrentUser() user: AuthUser) {
    return this.questionsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List questions" })
  @ApiPaginatedResponse(Question)
  findAll(@Query() query: QuestionQueryDto, @CurrentUser() user: AuthUser) {
    return this.questionsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a question" })
  @ApiOkResponse({ type: Question })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.questionsService.findOne(id, user);
  }

  @Patch(":id")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Update a question" })
  @ApiOkResponse({ type: Question })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateQuestionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.questionsService.update(id, dto, user);
  }

  @Patch(":id/review")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Approve or reject a question",
    description: "Sets approvedBy to the logged-in user and approvedAt to now.",
  })
  @ApiOkResponse({ type: Question })
  review(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ReviewQuestionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.questionsService.review(id, dto.status, user);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a question" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.questionsService.remove(id, user);
  }
}
