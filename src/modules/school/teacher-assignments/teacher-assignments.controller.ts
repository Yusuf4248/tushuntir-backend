import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { TeacherAssignmentsService } from "./teacher-assignments.service";
import { CreateTeacherAssignmentDto } from "./dto/create-teacher-assignment.dto";
import { UpdateTeacherAssignmentDto } from "./dto/update-teacher-assignment.dto";
import { TeacherAssignment } from "./entities/teacher-assignment.entity";
import { Roles } from "../../../app.constants";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/role.guard";

@ApiBearerAuth("JWT-auth")
@ApiTags("Teacher assignments")
@Controller("teacher-assignments")
export class TeacherAssignmentsController {
  constructor(private readonly teacherAssignmentsService: TeacherAssignmentsService) {}

  @Get("my-classes")
  @UseGuards(AuthGuard)
  async getMyClasses(@Req() req: any) {
    try {
      const user = req.user;
      if (!user || !user.id || user.role !== "teacher") {
        throw new UnauthorizedException(
          "Only teachers can access their classes"
        );
      }
      return this.teacherAssignmentsService.findByTeacher(user.id);
    } catch (error) {
      console.log(error);
    }
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Post()
  @ApiOperation({ summary: "Assign teacher to class" })
  @ApiResponse({
    status: 201,
    description: "Teacher successfully assigned to class.",
    type: TeacherAssignment,
  })
  create(@Body() createTeacherAssignmentDto: CreateTeacherAssignmentDto) {
    return this.teacherAssignmentsService.create(createTeacherAssignmentDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get()
  @ApiOperation({ summary: "Get all teacher-assignment assignments" })
  @ApiResponse({
    status: 200,
    description: "List of teacher-assignment assignments",
    type: [TeacherAssignment],
  })
  findAll() {
    return this.teacherAssignmentsService.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get(":id")
  @ApiOperation({ summary: "Get a single teacher-assignment assignment by ID" })
  @ApiParam({ name: "id", type: Number, description: "TeacherAssignment ID" })
  @ApiResponse({
    status: 200,
    description: "Single teacher-assignment assignment",
    type: TeacherAssignment,
  })
  findOne(@Param("id") id: string) {
    return this.teacherAssignmentsService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch(":id")
  @ApiOperation({ summary: "Update teacher-assignment assignment" })
  @ApiParam({ name: "id", type: Number, description: "TeacherAssignment ID" })
  @ApiResponse({
    status: 200,
    description: "Teacher assignment updated",
    type: TeacherAssignment,
  })
  update(
    @Param("id") id: string,
    @Body() updateTeacherAssignmentDto: UpdateTeacherAssignmentDto
  ) {
    return this.teacherAssignmentsService.update(+id, updateTeacherAssignmentDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Delete("remove")
  @ApiOperation({ summary: "Remove teacher-assignment assignment" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        classId: {
          type: "integer",
          example: 1,
          description: "ID of the class",
        },
        teacherId: {
          type: "integer",
          example: 5,
          description: "ID of the teacher",
        },
      },
      required: ["classId", "teacherId"],
    },
  })
  @ApiResponse({ status: 200, description: "Teacher assignment removed" })
  remove(
    @Body("classId", ParseIntPipe) classId: number,
    @Body("teacherId", ParseIntPipe) teacherId: number
  ) {
    return this.teacherAssignmentsService.remove(classId, teacherId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get("by-class/:classId")
  @ApiOperation({ summary: "Get all teachers in a class" })
  @ApiParam({ name: "classId", type: Number })
  @ApiResponse({
    status: 200,
    description: "List of class teachers",
    type: [TeacherAssignment],
  })
  async findByClass(
    @Param("classId", ParseIntPipe) classId: number
  ): Promise<TeacherAssignment[]> {
    return this.teacherAssignmentsService.findByClass(classId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get("by-teacher/:teacherId")
  @ApiOperation({ summary: "Get all classes of a teacher" })
  @ApiParam({ name: "teacherId", type: Number })
  @ApiResponse({
    status: 200,
    description: "List of classes for teacher",
    type: [TeacherAssignment],
  })
  async findByTeacher(
    @Param("teacherId", ParseIntPipe) teacherId: number
  ): Promise<TeacherAssignment[]> {
    return this.teacherAssignmentsService.findByTeacher(teacherId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get("active-in-class/:classId")
  @ApiOperation({ summary: "Get active teachers in a class" })
  @ApiParam({ name: "classId", type: Number })
  @ApiResponse({
    status: 200,
    description: "List of active teachers",
    type: [TeacherAssignment],
  })
  async findActiveTeachersInClass(
    @Param("classId", ParseIntPipe) classId: number
  ): Promise<TeacherAssignment[]> {
    return this.teacherAssignmentsService.findActiveTeachersInClass(classId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch("deactivate/:id")
  @ApiOperation({ summary: "Deactivate a teacher-assignment record" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({
    status: 200,
    description: "Deactivated record",
    type: TeacherAssignment,
  })
  async deactivateTeacher(
    @Param("id", ParseIntPipe) id: number
  ): Promise<TeacherAssignment> {
    return this.teacherAssignmentsService.deactivateTeacher(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch("activate/:id")
  @ApiOperation({ summary: "Activate a teacher-assignment record" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({
    status: 200,
    description: "Activated record",
    type: TeacherAssignment,
  })
  async activateTeacher(
    @Param("id", ParseIntPipe) id: number
  ): Promise<TeacherAssignment> {
    return this.teacherAssignmentsService.activateTeacher(id);
  }
}
