import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
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
  GradesDto,
  GradesQueryDto,
  TermDto,
  TimetableDto,
  TimetableQueryDto,
} from "./dto/school.dto";
import { StudentSchoolService } from "./student-school.service";
import { StudentHomeworkService } from "./student-homework.service";
import { StudentNotificationsService } from "./student-notifications.service";
import {
  NotificationDto,
  NotificationsQueryDto,
  ReadAllDto,
  UnreadCountDto,
} from "./dto/notification.dto";
import { SubmissionUploadInterceptor } from "./submission-upload.interceptor";
import { ContentTranslationInterceptor } from "./content-translation.interceptor";
import {
  HomeworkDetailDto,
  HomeworkItemDto,
  HomeworkQueryDto,
  SubmissionBodyDto,
} from "./dto/homework.dto";
import { HOUR, RateLimit } from "../../common/throttle/rate-limit.decorator";

/** The student's school day outside the AI loop: timetable, attendance, homework, grades, notifications. */
@ApiTags("Student · School")
@ApiHeader({
  name: "Accept-Language",
  required: false,
  description:
    "uz (default), ru or en: the language of subject names, lesson topics, homework titles and " +
    "notification texts. Names of people, classes and terms, and the student's own texts, are not translated.",
})
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(UserRole.STUDENT)
@UseInterceptors(ContentTranslationInterceptor)
@Controller("me")
export class MeSchoolController {
  constructor(
    private readonly school: StudentSchoolService,
    private readonly homework: StudentHomeworkService,
    private readonly notifications: StudentNotificationsService,
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

  @Get("terms")
  @ApiOperation({
    summary: "Terms of the student's academic year",
    description:
      "In order. isCurrent marks the term containing today, or during a break the last one that started " +
      "(the default term of /me/grades).",
  })
  @ApiOkResponse({ type: [TermDto] })
  terms(@CurrentUser() user: AuthUser) {
    return this.school.terms(user);
  }

  @Get("grades")
  @ApiOperation({
    summary: "The student's grades of a term with per-subject averages",
    description:
      "Grades (date, subject, kind, value 2-5, comment, teacher), newest first, filtered by subjectId; " +
      "termId defaults to the term containing today (or the last one started). averages: per subject, two decimals.",
  })
  @ApiOkResponse({ type: GradesDto })
  grades(@Query() query: GradesQueryDto, @CurrentUser() user: AuthUser) {
    return this.school.grades(user, query);
  }

  @Get("notifications")
  @ApiOperation({
    summary: "The student's notifications, newest first",
    description:
      "Reading this (or the unread count) first adds what is missing: a new grade (last 7 days), homework " +
      "checked or returned, written homework due tomorrow and not submitted, a lesson quiz that unlocked " +
      "(last 7 days, still open). Checkpoint passed is added when it happens. data links to the item " +
      "(homeworkId, quizId, gradeId, topicId, …). limit 1-100, default 50.",
  })
  @ApiOkResponse({ type: [NotificationDto] })
  notificationList(
    @Query() query: NotificationsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.notifications.list(user, query);
  }

  @Get("notifications/unread-count")
  @ApiOperation({ summary: "How many notifications are unread" })
  @ApiOkResponse({ type: UnreadCountDto })
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notifications.unreadCount(user);
  }

  @Patch("notifications/:id/read")
  @ApiOperation({ summary: "Mark one notification read (own only, else 404)" })
  @ApiOkResponse({ type: NotificationDto })
  markRead(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.notifications.markRead(id, user);
  }

  @Post("notifications/read-all")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark all my notifications read" })
  @ApiOkResponse({ type: ReadAllDto })
  readAll(@CurrentUser() user: AuthUser) {
    return this.notifications.readAll(user);
  }
}
