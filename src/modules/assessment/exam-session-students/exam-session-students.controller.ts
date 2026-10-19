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
import { CreateExamSessionStudentDto } from "./dto/create-exam-session-student.dto";
import { ExamSessionStudentQueryDto } from "./dto/exam-session-student-query.dto";
import { UpdateExamSessionStudentDto } from "./dto/update-exam-session-student.dto";
import { ExamSessionStudent } from "./entities/exam-session-student.entity";
import { ExamSessionStudentsService } from "./exam-session-students.service";

@ApiTags("Assessment · Exam session students")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("exam-session-students")
export class ExamSessionStudentsController {
  constructor(
    private readonly examSessionStudentsService: ExamSessionStudentsService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create an exam session student" })
  @ApiCreatedResponse({ type: ExamSessionStudent })
  create(
    @Body() dto: CreateExamSessionStudentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.examSessionStudentsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List exam session students" })
  @ApiPaginatedResponse(ExamSessionStudent)
  findAll(
    @Query() query: ExamSessionStudentQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.examSessionStudentsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an exam session student" })
  @ApiOkResponse({ type: ExamSessionStudent })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.examSessionStudentsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an exam session student" })
  @ApiOkResponse({ type: ExamSessionStudent })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateExamSessionStudentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.examSessionStudentsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an exam session student" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.examSessionStudentsService.remove(id, user);
  }
}
