import { Controller, Get, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { AuthUser } from "../../common/auth/auth-user";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums";
import { ApiErrorResponses } from "../../common/swagger/api-responses.decorator";
import { TimetableDto, TimetableQueryDto } from "./dto/school.dto";
import { StudentSchoolService } from "./student-school.service";

/** The student's school day outside the AI loop: timetable, attendance, homework, grades, notifications. */
@ApiTags("Student · School")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(UserRole.STUDENT)
@Controller("me")
export class MeSchoolController {
  constructor(private readonly school: StudentSchoolService) {}

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
}
