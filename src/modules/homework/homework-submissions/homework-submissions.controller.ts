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
import { CreateHomeworkSubmissionDto } from "./dto/create-homework-submission.dto";
import { HomeworkSubmissionQueryDto } from "./dto/homework-submission-query.dto";
import { UpdateHomeworkSubmissionDto } from "./dto/update-homework-submission.dto";
import { HomeworkSubmission } from "./entities/homework-submission.entity";
import { HomeworkSubmissionsService } from "./homework-submissions.service";

@ApiTags("Homework · Homework submissions")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("homework-submissions")
export class HomeworkSubmissionsController {
  constructor(
    private readonly homeworkSubmissionsService: HomeworkSubmissionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a homework submission" })
  @ApiCreatedResponse({ type: HomeworkSubmission })
  create(
    @Body() dto: CreateHomeworkSubmissionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.homeworkSubmissionsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List homework submissions" })
  @ApiPaginatedResponse(HomeworkSubmission)
  findAll(
    @Query() query: HomeworkSubmissionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.homeworkSubmissionsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a homework submission" })
  @ApiOkResponse({ type: HomeworkSubmission })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.homeworkSubmissionsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a homework submission" })
  @ApiOkResponse({ type: HomeworkSubmission })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateHomeworkSubmissionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.homeworkSubmissionsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a homework submission" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.homeworkSubmissionsService.remove(id, user);
  }
}
