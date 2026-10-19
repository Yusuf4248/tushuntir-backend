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
import { CreateExamSessionDto } from "./dto/create-exam-session.dto";
import { ExamSessionQueryDto } from "./dto/exam-session-query.dto";
import { UpdateExamSessionDto } from "./dto/update-exam-session.dto";
import { ExamSession } from "./entities/exam-session.entity";
import { ExamSessionsService } from "./exam-sessions.service";

@ApiTags("Assessment · Exam sessions")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("exam-sessions")
export class ExamSessionsController {
  constructor(private readonly examSessionsService: ExamSessionsService) {}

  @Post()
  @ApiOperation({ summary: "Create an exam session" })
  @ApiCreatedResponse({ type: ExamSession })
  create(@Body() dto: CreateExamSessionDto, @CurrentUser() user: AuthUser) {
    return this.examSessionsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List exam sessions" })
  @ApiPaginatedResponse(ExamSession)
  findAll(@Query() query: ExamSessionQueryDto, @CurrentUser() user: AuthUser) {
    return this.examSessionsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an exam session" })
  @ApiOkResponse({ type: ExamSession })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.examSessionsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an exam session" })
  @ApiOkResponse({ type: ExamSession })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateExamSessionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.examSessionsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an exam session" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.examSessionsService.remove(id, user);
  }
}
