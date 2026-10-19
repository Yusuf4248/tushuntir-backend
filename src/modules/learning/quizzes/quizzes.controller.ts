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
  Put,
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
import { QuizQuestion } from "../quiz-questions/entities/quiz-question.entity";
import { CreateQuizDto } from "./dto/create-quiz.dto";
import { ReplaceQuizQuestionsDto } from "./dto/replace-quiz-questions.dto";
import { QuizQueryDto } from "./dto/quiz-query.dto";
import { UpdateQuizDto } from "./dto/update-quiz.dto";
import { Quiz } from "./entities/quiz.entity";
import { QuizzesService } from "./quizzes.service";

@ApiTags("Learning · Quizzes")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("quizzes")
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @ApiOperation({ summary: "Create a quiz" })
  @ApiCreatedResponse({ type: Quiz })
  create(@Body() dto: CreateQuizDto, @CurrentUser() user: AuthUser) {
    return this.quizzesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List quizzes" })
  @ApiPaginatedResponse(Quiz)
  findAll(@Query() query: QuizQueryDto, @CurrentUser() user: AuthUser) {
    return this.quizzesService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a quiz" })
  @ApiOkResponse({ type: Quiz })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a quiz" })
  @ApiOkResponse({ type: Quiz })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateQuizDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.update(id, dto, user);
  }

  @Put(":id/questions")
  @ApiOperation({
    summary: "Replace the quiz's question list",
    description: "Ordered: position 1, 2, 3... follows the order of the list.",
  })
  @ApiOkResponse({ type: [QuizQuestion] })
  replaceQuestions(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ReplaceQuizQuestionsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.replaceQuestions(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a quiz" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.quizzesService.remove(id, user);
  }
}
