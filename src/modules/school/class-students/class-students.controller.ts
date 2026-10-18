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
import { ClassStudentsService } from "./class-students.service";
import { CreateClassStudentDto } from "./dto/create-class-student.dto";
import { UpdateClassStudentDto } from "./dto/update-class-student.dto";
import { ClassStudent } from "./entities/class-student.entity";
import { Roles } from "../../../app.constants";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/role.guard";

@ApiBearerAuth("JWT-auth")
@ApiTags("Class students")
@Controller("class-students")
export class ClassStudentsController {
  constructor(private readonly classStudentsService: ClassStudentsService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Post()
  @ApiOperation({
    summary: "Create a new class-student relationship",
    description: "Add a student to a class with specified status and period",
  })
  @ApiBody({
    type: CreateClassStudentDto,
    description: "Class student data to create",
  })
  @ApiCreatedResponse({
    description: "Class student relationship created successfully",
    type: ClassStudent,
  })
  @ApiBadRequestResponse({
    description: "Invalid input data or validation error",
  })
  create(@Body() createClassStudentDto: CreateClassStudentDto) {
    return this.classStudentsService.create(createClassStudentDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get()
  @ApiOperation({
    summary: "Get all class-student relationships",
    description: "Retrieve a list of all class-student relationships",
  })
  @ApiOkResponse({
    description: "List of class-student relationships retrieved successfully",
    type: [ClassStudent],
  })
  findAll() {
    return this.classStudentsService.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin", "teacher", "student")
  @Get(":id")
  @ApiOperation({
    summary: "Get a specific class-student relationship",
    description: "Retrieve a class-student relationship by its ID",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "The ID of the class-student relationship",
    example: 1,
  })
  @ApiOkResponse({
    description: "Class-student relationship found successfully",
    type: ClassStudent,
  })
  @ApiNotFoundResponse({
    description: "Class-student relationship not found",
  })
  @ApiBadRequestResponse({
    description: "Invalid ID format",
  })
  findOne(@Param("id") id: string) {
    return this.classStudentsService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch(":id")
  @ApiOperation({
    summary: "Update a class-student relationship",
    description: "Update an existing class-student relationship by ID",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "The ID of the class-student relationship to update",
    example: 1,
  })
  @ApiBody({
    type: UpdateClassStudentDto,
    description: "Class student data to update",
  })
  @ApiOkResponse({
    description: "Class-student relationship updated successfully",
    type: ClassStudent,
  })
  @ApiNotFoundResponse({
    description: "Class-student relationship not found",
  })
  @ApiBadRequestResponse({
    description: "Invalid input data or validation error",
  })
  update(
    @Param("id") id: string,
    @Body() updateClassStudentDto: UpdateClassStudentDto
  ) {
    return this.classStudentsService.update(+id, updateClassStudentDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Delete(":id")
  @ApiOperation({
    summary: "Delete a class-student relationship",
    description: "Remove a student from a class by deleting the relationship",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "The ID of the class-student relationship to delete",
    example: 1,
  })
  @ApiOkResponse({
    description: "Class-student relationship deleted successfully",
  })
  @ApiNotFoundResponse({
    description: "Class-student relationship not found",
  })
  @ApiBadRequestResponse({
    description: "Invalid ID format",
  })
  remove(@Param("id") id: string) {
    return this.classStudentsService.remove(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get("by-class/:classId")
  @ApiOperation({ summary: "Get all students in a class" })
  @ApiParam({ name: "classId", type: Number })
  @ApiResponse({
    status: 200,
    description: "List of class students",
    type: [ClassStudent],
  })
  async findByClass(
    @Param("classId", ParseIntPipe) classId: number
  ): Promise<ClassStudent[]> {
    return this.classStudentsService.findByClass(classId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin", "student")
  @Get("by-student/:studentId")
  @ApiOperation({ summary: "Get all classes of a student" })
  @ApiParam({ name: "studentId", type: Number })
  @ApiResponse({
    status: 200,
    description: "List of classes for student",
    type: [ClassStudent],
  })
  async findByStudent(
    @Param("studentId", ParseIntPipe) studentId: number
  ): Promise<ClassStudent[]> {
    return this.classStudentsService.findByStudent(studentId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin", "teacher")
  @Get("active-in-class/:classId")
  @ApiOperation({ summary: "Get active students in a class" })
  @ApiParam({ name: "classId", type: Number })
  @ApiResponse({
    status: 200,
    description: "List of active students",
    type: [ClassStudent],
  })
  async findActiveStudentsInClass(
    @Param("classId", ParseIntPipe) classId: number
  ) {
    return this.classStudentsService.findActiveStudentsInClass(classId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch("deactivate/:id")
  @ApiOperation({ summary: "Deactivate a class-student record" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({
    status: 200,
    description: "Deactivated record",
    type: ClassStudent,
  })
  async deactivateStudent(
    @Param("id", ParseIntPipe) id: number
  ): Promise<ClassStudent> {
    return this.classStudentsService.deactivateStudent(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch("activate/:id")
  @ApiOperation({ summary: "Activate a class-student record" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({
    status: 200,
    description: "Activated record",
    type: ClassStudent,
  })
  async activateStudent(
    @Param("id", ParseIntPipe) id: number
  ): Promise<ClassStudent> {
    return this.classStudentsService.activateStudent(id);
  }
}
