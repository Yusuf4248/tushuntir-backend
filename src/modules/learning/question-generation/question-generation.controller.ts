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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { AuthUser } from "../../../common/auth/auth-user";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { UserRole } from "../../../common/enums";
import { ApiErrorResponses } from "../../../common/swagger/api-responses.decorator";
import {
  ApproveAllResultDto,
  GenerationResultDto,
} from "./dto/generation-result.dto";
import { QuestionGenerationService } from "./question-generation.service";

@ApiTags("Learning · Question generation")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
@Controller("topics")
export class QuestionGenerationController {
  constructor(private readonly generation: QuestionGenerationService) {}

  @Post(":id/generate-questions")
  @ApiOperation({
    summary: "Generate ~25 draft questions for a topic with AI",
    description:
      "Uses the topic's textbook chunks. Each question gets 3 hints, an explanation and, for multiple choice, " +
      "the misconception behind each wrong option. A self-check pass answers every question without the key " +
      "and drops the ones it gets wrong or cannot answer from the text. Saved as drafts; a teacher approves them. " +
      "Takes up to a minute; 503 if the AI is unavailable.",
  })
  @ApiCreatedResponse({ type: GenerationResultDto })
  generate(@Param("id", ParseIntPipe) id: number) {
    return this.generation.generate(id);
  }

  @Post(":id/questions/approve-all")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Approve every draft question of a topic (demo shortcut)",
  })
  @ApiOkResponse({ type: ApproveAllResultDto })
  async approveAll(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<ApproveAllResultDto> {
    return {
      topicId: id,
      approved: await this.generation.approveAll(id, user.id),
    };
  }
}
