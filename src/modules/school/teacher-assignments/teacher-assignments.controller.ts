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
import { CreateTeacherAssignmentDto } from "./dto/create-teacher-assignment.dto";
import { TeacherAssignmentQueryDto } from "./dto/teacher-assignment-query.dto";
import { UpdateTeacherAssignmentDto } from "./dto/update-teacher-assignment.dto";
import { TeacherAssignment } from "./entities/teacher-assignment.entity";
import { TeacherAssignmentsService } from "./teacher-assignments.service";

@ApiTags("School · Teacher assignments")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("teacher-assignments")
export class TeacherAssignmentsController {
  constructor(
    private readonly teacherAssignmentsService: TeacherAssignmentsService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a teacher assignment" })
  @ApiCreatedResponse({ type: TeacherAssignment })
  create(
    @Body() dto: CreateTeacherAssignmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.teacherAssignmentsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List teacher assignments" })
  @ApiPaginatedResponse(TeacherAssignment)
  findAll(
    @Query() query: TeacherAssignmentQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.teacherAssignmentsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a teacher assignment" })
  @ApiOkResponse({ type: TeacherAssignment })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.teacherAssignmentsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a teacher assignment" })
  @ApiOkResponse({ type: TeacherAssignment })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateTeacherAssignmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.teacherAssignmentsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a teacher assignment" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.teacherAssignmentsService.remove(id, user);
  }
}
