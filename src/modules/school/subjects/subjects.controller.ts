import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { SubjectsService } from "./subjects.service";
import { UpdateSubjectDto } from "./dto/update-subject.dto";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Roles } from "../../../app.constants";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/role.guard";

@ApiTags("Subjects")
@ApiBearerAuth("JWT-auth")
@Controller("subjects")
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Post()
  @ApiOperation({ summary: "Create a new subject" })
  @ApiResponse({ status: 201, description: "Subject successfully created." })
  @ApiBody({ type: CreateSubjectDto })
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all subjects" })
  @ApiResponse({ status: 200, description: "List of all subjects." })
  findAll() {
    return this.subjectsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a subject by ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, description: "Subject found." })
  @ApiResponse({ status: 404, description: "Subject not found." })
  findOne(@Param("id") id: string) {
    return this.subjectsService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Patch(":id")
  @ApiOperation({ summary: "Update a subject by ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ type: UpdateSubjectDto })
  @ApiResponse({ status: 200, description: "Subject updated successfully." })
  update(@Param("id") id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectsService.update(+id, updateSubjectDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Delete(":id")
  @ApiOperation({ summary: "Delete a subject by ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, description: "Subject deleted successfully." })
  remove(@Param("id") id: string) {
    return this.subjectsService.remove(+id);
  }
}
