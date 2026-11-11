import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
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
import { DemoService } from "./demo.service";
import { FinishLessonResponseDto } from "./dto/finish-lesson-response.dto";

@ApiTags("Demo · Lessons")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(UserRole.STUDENT, UserRole.TEACHER)
@Controller("demo")
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Post("finish-lesson/:lessonId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "End a lesson now so its quiz unlocks (DEMO_MODE only)",
    description:
      "Only when DEMO_MODE=true; otherwise 404. Students may end a lesson of their own class, teachers only " +
      "their own lessons (others get 404; other roles 403). Sets lessons.ended_at to now. " +
      "If the lesson's quiz would close within an hour, its deadline moves to two hours from now.",
  })
  @ApiOkResponse({ type: FinishLessonResponseDto })
  finishLesson(
    @Param("lessonId", ParseIntPipe) lessonId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.demoService.finishLesson(lessonId, user);
  }
}
