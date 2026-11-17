import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { AuthUser } from "../../common/auth/auth-user";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums";
import { ApiErrorResponses } from "../../common/swagger/api-responses.decorator";
import {
  AttendanceDto,
  AttendanceQueryDto,
  TimetableDto,
  TimetableQueryDto,
} from "./dto/school.dto";
import { StudentSchoolService } from "./student-school.service";
import { StudentHomeworkService } from "./student-homework.service";
import { SubmissionUploadInterceptor } from "./submission-upload.interceptor";
import {
  HomeworkDetailDto,
  HomeworkItemDto,
  HomeworkQueryDto,
  SubmissionBodyDto,
} from "./dto/homework.dto";
import { HOUR, RateLimit } from "../../common/throttle/rate-limit.decorator";

/** The student's school day outside the AI loop: timetable, attendance, homework, grades, notifications. */
@ApiTags("Student · School")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(UserRole.STUDENT)
@Controller("me")
export class MeSchoolController {
  constructor(
    private readonly school: StudentSchoolService,
    private readonly homework: StudentHomeworkService,
  ) {}

  @Get("timetable")
  @ApiOperation({
    summary: "The class timetable of a week (Monday to Saturday)",
    description:
      "Lessons per day with time, subject, teacher, room, topic and status (upcoming / in_progress / finished), " +
      "plus whether the lesson has an AI quiz or written homework. Default: this week. A slot without a lesson " +
      "record (future weeks) has lessonId null; days outside a term (school breaks) are empty.",
  })
  @ApiOkResponse({ type: TimetableDto })
  timetable(@Query() query: TimetableQueryDto, @CurrentUser() user: AuthUser) {
    return this.school.timetable(user, query.weekStart);
  }

  @Get("attendance")
  @ApiOperation({
    summary: "The student's attendance of a month",
    description:
      "Records (date, period, subject, lesson, status present / absent / late / excused, note), oldest first, " +
      "and a summary. percent = (present + late) / (all records - excused) * 100. Default: this month.",
  })
  @ApiOkResponse({ type: AttendanceDto })
  attendance(
    @Query() query: AttendanceQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.school.attendance(user, query.month);
  }

  @Get("homework")
  @ApiOperation({
    summary: "Written homework of the student's class",
    description:
      "Newest due date first. Lesson quizzes are not here (see /me/quizzes). status per item: new / overdue " +
      "(not submitted, before / after the deadline), submitted, late (submitted after the deadline), " +
      "checked, returned.",
  })
  @ApiOkResponse({ type: [HomeworkItemDto] })
  homeworkList(
    @Query() query: HomeworkQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.homework.list(user, query.status);
  }

  @Get("homework/:id")
  @ApiOperation({
    summary: "One homework: description, the teacher's files and my submission",
  })
  @ApiOkResponse({ type: HomeworkDetailDto })
  homeworkDetail(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.homework.detail(id, user);
  }

  @Post("homework/:id/submission")
  @HttpCode(HttpStatus.OK)
  @RateLimit(20, HOUR)
  @UseInterceptors(SubmissionUploadInterceptor)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description:
      "text and/or up to 3 files (field files: jpg, png, webp, gif or pdf; 10 MB each; no SVG).",
    schema: {
      type: "object",
      properties: {
        text: { type: "string", maxLength: 5000 },
        files: { type: "array", items: { type: "string", format: "binary" } },
      },
    },
  })
  @ApiOperation({
    summary: "Submit or update my homework",
    description:
      "Creates my submission or updates it until the teacher checks it (409 after that; a returned one can be " +
      "sent again). Sent text replaces the text; sent files replace all previous files, otherwise they are kept. " +
      "After the deadline the submission is marked late. Returns the homework with my submission.",
  })
  @ApiOkResponse({ type: HomeworkDetailDto })
  submitHomework(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: SubmissionBodyDto,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.homework.submit(
      id,
      { text: body.text, files: files ?? [] },
      user,
    );
  }
}
