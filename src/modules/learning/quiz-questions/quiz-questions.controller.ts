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
import { CreateQuizQuestionDto } from "./dto/create-quiz-question.dto";
import { QuizQuestionQueryDto } from "./dto/quiz-question-query.dto";
import { UpdateQuizQuestionDto } from "./dto/update-quiz-question.dto";
import { QuizQuestion } from "./entities/quiz-question.entity";
import { QuizQuestionsService } from "./quiz-questions.service";

@ApiTags("Learning · Quiz questions")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("quiz-questions")
export class QuizQuestionsController {
  constructor(private readonly quizQuestionsService: QuizQuestionsService) {}

  @Post()
  @ApiOperation({ summary: "Create a quiz question" })
  @ApiCreatedResponse({ type: QuizQuestion })
  create(@Body() dto: CreateQuizQuestionDto, @CurrentUser() user: AuthUser) {
    return this.quizQuestionsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List quiz questions" })
  @ApiPaginatedResponse(QuizQuestion)
  findAll(@Query() query: QuizQuestionQueryDto, @CurrentUser() user: AuthUser) {
    return this.quizQuestionsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a quiz question" })
  @ApiOkResponse({ type: QuizQuestion })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizQuestionsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a quiz question" })
  @ApiOkResponse({ type: QuizQuestion })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateQuizQuestionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizQuestionsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a quiz question" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.quizQuestionsService.remove(id, user);
  }
}
