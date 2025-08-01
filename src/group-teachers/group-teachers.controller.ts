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
} from "@nestjs/swagger";
import { GroupTeachersService } from "./group-teachers.service";
import { CreateGroupTeacherDto } from "./dto/create-group-teacher.dto";
import { UpdateGroupTeacherDto } from "./dto/update-group-teacher.dto";
import { GroupTeacher } from "./entities/group-teacher.entity";
import { Roles } from "../app.constants";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/role.guard";

@ApiBearerAuth("JWT-auth")
@ApiTags("Group-Teachers")
@Controller("group-teachers")
export class GroupTeachersController {
  constructor(private readonly groupTeachersService: GroupTeachersService) {}

  @Get("my-groups")
  @UseGuards(AuthGuard)
  async getMyGroups(@Req() req: any) {
    try {
      const user = req.user;
      if (!user || !user.id || user.role !== "teacher") {
        throw new UnauthorizedException(
          "Only teachers can access their groups"
        );
      }
      return this.groupTeachersService.findByTeacher(user.id);
    } catch (error) {
      console.log(error);
    }
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Post()
  @ApiOperation({ summary: "Assign teacher to group" })
  @ApiResponse({
    status: 201,
    description: "Teacher successfully assigned to group.",
    type: GroupTeacher,
  })
  create(@Body() createGroupTeacherDto: CreateGroupTeacherDto) {
    return this.groupTeachersService.create(createGroupTeacherDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get()
  @ApiOperation({ summary: "Get all group-teacher assignments" })
  @ApiResponse({
    status: 200,
    description: "List of group-teacher assignments",
    type: [GroupTeacher],
  })
  findAll() {
    return this.groupTeachersService.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get(":id")
  @ApiOperation({ summary: "Get a single group-teacher assignment by ID" })
  @ApiParam({ name: "id", type: Number, description: "GroupTeacher ID" })
  @ApiResponse({
    status: 200,
    description: "Single group-teacher assignment",
    type: GroupTeacher,
  })
  findOne(@Param("id") id: string) {
    return this.groupTeachersService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch(":id")
  @ApiOperation({ summary: "Update group-teacher assignment" })
  @ApiParam({ name: "id", type: Number, description: "GroupTeacher ID" })
  @ApiResponse({
    status: 200,
    description: "Group-teacher assignment updated",
    type: GroupTeacher,
  })
  update(
    @Param("id") id: string,
    @Body() updateGroupTeacherDto: UpdateGroupTeacherDto
  ) {
    return this.groupTeachersService.update(+id, updateGroupTeacherDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Delete(":id")
  @ApiOperation({ summary: "Remove group-teacher assignment" })
  @ApiParam({ name: "id", type: Number, description: "GroupTeacher ID" })
  @ApiResponse({ status: 200, description: "Group-teacher assignment removed" })
  remove(@Param("id") id: string) {
    return this.groupTeachersService.remove(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get("by-group/:groupId")
  @ApiOperation({ summary: "Get all teachers in a group" })
  @ApiParam({ name: "groupId", type: Number })
  @ApiResponse({
    status: 200,
    description: "List of group teachers",
    type: [GroupTeacher],
  })
  async findByGroup(
    @Param("groupId", ParseIntPipe) groupId: number
  ): Promise<GroupTeacher[]> {
    return this.groupTeachersService.findByGroup(groupId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get("by-teacher/:teacherId")
  @ApiOperation({ summary: "Get all groups of a teacher" })
  @ApiParam({ name: "teacherId", type: Number })
  @ApiResponse({
    status: 200,
    description: "List of groups for teacher",
    type: [GroupTeacher],
  })
  async findByTeacher(
    @Param("teacherId", ParseIntPipe) teacherId: number
  ): Promise<GroupTeacher[]> {
    return this.groupTeachersService.findByTeacher(teacherId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Get("active-in-group/:groupId")
  @ApiOperation({ summary: "Get active teachers in a group" })
  @ApiParam({ name: "groupId", type: Number })
  @ApiResponse({
    status: 200,
    description: "List of active teachers",
    type: [GroupTeacher],
  })
  async findActiveTeachersInGroup(
    @Param("groupId", ParseIntPipe) groupId: number
  ): Promise<GroupTeacher[]> {
    return this.groupTeachersService.findActiveTeachersInGroup(groupId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch("deactivate/:id")
  @ApiOperation({ summary: "Deactivate a group-teacher record" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({
    status: 200,
    description: "Deactivated record",
    type: GroupTeacher,
  })
  async deactivateTeacher(
    @Param("id", ParseIntPipe) id: number
  ): Promise<GroupTeacher> {
    return this.groupTeachersService.deactivateTeacher(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @Patch("activate/:id")
  @ApiOperation({ summary: "Activate a group-teacher record" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({
    status: 200,
    description: "Activated record",
    type: GroupTeacher,
  })
  async activateTeacher(
    @Param("id", ParseIntPipe) id: number
  ): Promise<GroupTeacher> {
    return this.groupTeachersService.activateTeacher(id);
  }
}
