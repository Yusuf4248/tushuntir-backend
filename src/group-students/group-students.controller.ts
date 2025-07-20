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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { GroupStudentsService } from "./group-students.service";
import { CreateGroupStudentDto } from "./dto/create-group-student.dto";
import { UpdateGroupStudentDto } from "./dto/update-group-student.dto";
import { GroupStudent } from "./entities/group-student.entity";
import { Roles } from "../app.constants";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/role.guard";

@ApiBearerAuth("JWT-auth")
@ApiTags("Group Students")
@Controller("group-students")
export class GroupStudentsController {
  constructor(private readonly groupStudentsService: GroupStudentsService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Post()
  @ApiOperation({
    summary: "Create a new group-student relationship",
    description: "Add a student to a group with specified status and period",
  })
  @ApiBody({
    type: CreateGroupStudentDto,
    description: "Group student data to create",
  })
  @ApiCreatedResponse({
    description: "Group student relationship created successfully",
    type: GroupStudent,
  })
  @ApiBadRequestResponse({
    description: "Invalid input data or validation error",
  })
  create(@Body() createGroupStudentDto: CreateGroupStudentDto) {
    return this.groupStudentsService.create(createGroupStudentDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get()
  @ApiOperation({
    summary: "Get all group-student relationships",
    description: "Retrieve a list of all group-student relationships",
  })
  @ApiOkResponse({
    description: "List of group-student relationships retrieved successfully",
    type: [GroupStudent],
  })
  findAll() {
    return this.groupStudentsService.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get(":id")
  @ApiOperation({
    summary: "Get a specific group-student relationship",
    description: "Retrieve a group-student relationship by its ID",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "The ID of the group-student relationship",
    example: 1,
  })
  @ApiOkResponse({
    description: "Group-student relationship found successfully",
    type: GroupStudent,
  })
  @ApiNotFoundResponse({
    description: "Group-student relationship not found",
  })
  @ApiBadRequestResponse({
    description: "Invalid ID format",
  })
  findOne(@Param("id") id: string) {
    return this.groupStudentsService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch(":id")
  @ApiOperation({
    summary: "Update a group-student relationship",
    description: "Update an existing group-student relationship by ID",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "The ID of the group-student relationship to update",
    example: 1,
  })
  @ApiBody({
    type: UpdateGroupStudentDto,
    description: "Group student data to update",
  })
  @ApiOkResponse({
    description: "Group-student relationship updated successfully",
    type: GroupStudent,
  })
  @ApiNotFoundResponse({
    description: "Group-student relationship not found",
  })
  @ApiBadRequestResponse({
    description: "Invalid input data or validation error",
  })
  update(
    @Param("id") id: string,
    @Body() updateGroupStudentDto: UpdateGroupStudentDto
  ) {
    return this.groupStudentsService.update(+id, updateGroupStudentDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Delete(":id")
  @ApiOperation({
    summary: "Delete a group-student relationship",
    description: "Remove a student from a group by deleting the relationship",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "The ID of the group-student relationship to delete",
    example: 1,
  })
  @ApiOkResponse({
    description: "Group-student relationship deleted successfully",
  })
  @ApiNotFoundResponse({
    description: "Group-student relationship not found",
  })
  @ApiBadRequestResponse({
    description: "Invalid ID format",
  })
  remove(@Param("id") id: string) {
    return this.groupStudentsService.remove(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get("by-group/:groupId")
  @ApiOperation({ summary: "Get all students in a group" })
  @ApiParam({ name: "groupId", type: Number })
  @ApiResponse({
    status: 200,
    description: "List of group students",
    type: [GroupStudent],
  })
  async findByGroup(
    @Param("groupId", ParseIntPipe) groupId: number
  ): Promise<GroupStudent[]> {
    return this.groupStudentsService.findByGroup(groupId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get("by-student/:studentId")
  @ApiOperation({ summary: "Get all groups of a student" })
  @ApiParam({ name: "studentId", type: Number })
  @ApiResponse({
    status: 200,
    description: "List of groups for student",
    type: [GroupStudent],
  })
  async findByStudent(
    @Param("studentId", ParseIntPipe) studentId: number
  ): Promise<GroupStudent[]> {
    return this.groupStudentsService.findByStudent(studentId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get("active-in-group/:groupId")
  @ApiOperation({ summary: "Get active students in a group" })
  @ApiParam({ name: "groupId", type: Number })
  @ApiResponse({
    status: 200,
    description: "List of active students",
    type: [GroupStudent],
  })
  async findActiveStudentsInGroup(
    @Param("groupId", ParseIntPipe) groupId: number
  ): Promise<GroupStudent[]> {
    return this.groupStudentsService.findActiveStudentsInGroup(groupId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch("deactivate/:id")
  @ApiOperation({ summary: "Deactivate a group-student record" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({
    status: 200,
    description: "Deactivated record",
    type: GroupStudent,
  })
  async deactivateStudent(
    @Param("id", ParseIntPipe) id: number
  ): Promise<GroupStudent> {
    return this.groupStudentsService.deactivateStudent(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch("activate/:id")
  @ApiOperation({ summary: "Activate a group-student record" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({
    status: 200,
    description: "Activated record",
    type: GroupStudent,
  })
  async activateStudent(
    @Param("id", ParseIntPipe) id: number
  ): Promise<GroupStudent> {
    return this.groupStudentsService.activateStudent(id);
  }
}
