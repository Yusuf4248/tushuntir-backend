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
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { LessonQueryDto } from "./dto/lesson-query.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import { Lesson } from "./entities/lesson.entity";
import { LessonsService } from "./lessons.service";

@ApiTags("Daily · Lessons")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("lessons")
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @ApiOperation({ summary: "Create a lesson" })
  @ApiCreatedResponse({ type: Lesson })
  create(@Body() dto: CreateLessonDto, @CurrentUser() user: AuthUser) {
    return this.lessonsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List lessons" })
  @ApiPaginatedResponse(Lesson)
  findAll(@Query() query: LessonQueryDto, @CurrentUser() user: AuthUser) {
    return this.lessonsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a lesson" })
  @ApiOkResponse({ type: Lesson })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lessonsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a lesson" })
  @ApiOkResponse({ type: Lesson })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lessonsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a lesson" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.lessonsService.remove(id, user);
  }
}
