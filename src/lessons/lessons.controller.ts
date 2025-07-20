import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from "@nestjs/common";
import { LessonsService } from "./lessons.service";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { Lesson } from "./entities/lesson.entity";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/role.guard";
import { Roles } from "../app.constants";
import { UpdateLessonStatusDto } from "./dto/update-lesson-status.dto";

@ApiBearerAuth("JWT-auth")
@ApiTags("Lessons")
@Controller("lessons")
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Post()
  @ApiOperation({ summary: "Create a new lesson" })
  @ApiResponse({ status: 201, type: Lesson })
  create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.create(createLessonDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get()
  @ApiOperation({ summary: "Get all lessons with pagination" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  @ApiResponse({ status: 200, type: [Lesson] })
  findAll(@Query("page") page = 1, @Query("limit") limit = 10) {
    return this.lessonsService.findAll(Number(page), Number(limit));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one lesson by ID" })
  @ApiResponse({ status: 200, type: Lesson })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.lessonsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update lesson by ID" })
  @ApiResponse({ status: 200, type: Lesson })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateLessonDto: UpdateLessonDto
  ) {
    return this.lessonsService.update(id, updateLessonDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete lesson by ID" })
  @ApiResponse({ status: 200, description: "Successfully deleted" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.lessonsService.remove(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin", "teacher", "student")
  @Get("group/:groupId")
  @ApiOperation({ summary: "Get all lessons by group" })
  async findAllByGroup(@Param("groupId", ParseIntPipe) groupId: number) {
    return this.lessonsService.findGroupAllLessons(groupId);
  }

  @Patch(":id/status")
  @ApiOperation({
    summary:
      "Update lesson status and note, also changes title and note of other lessons",
  })
  @ApiParam({ name: "id", type: Number, description: "Lesson ID" })
  @ApiBody({
    type: UpdateLessonStatusDto,
    description: "Status and note for the lesson",
  })
  @ApiResponse({
    status: 200,
    description: "Lesson status updated successfully",
  })
  async updateLessonStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateLessonStatusDto
  ) {
    return this.lessonsService.updateLessonStatus(id, body.status, body.note);
  }
}
