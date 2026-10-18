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
import { ExamSessionsService } from "./exam-sessions.service";
import { CreateExamSessionDto } from "./dto/create-exam-session.dto";
import { UpdateExamSessionDto } from "./dto/update-exam-session.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Roles } from "../../../app.constants";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/role.guard";

@ApiTags("Exam sessions")
@ApiBearerAuth("JWT-auth")
@Controller("exam-sessions")
export class ExamSessionsController {
  constructor(private readonly examSessionsService: ExamSessionsService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Post()
  @ApiOperation({ summary: "Create a new exam" })
  @ApiResponse({ status: 201, description: "Exam successfully created." })
  @ApiResponse({ status: 400, description: "Validation failed." })
  create(@Body() createExamSessionDto: CreateExamSessionDto) {
    return this.examSessionsService.create(createExamSessionDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Get()
  @ApiOperation({ summary: "Get all exams" })
  @ApiResponse({ status: 200, description: "List of all exams" })
  findAll() {
    return this.examSessionsService.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Get(":id")
  @ApiOperation({ summary: "Get exam by ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, description: "Exam found" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  findOne(@Param("id") id: string) {
    return this.examSessionsService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Patch(":id")
  @ApiOperation({ summary: "Update exam by ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, description: "Exam updated successfully" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  update(@Param("id") id: string, @Body() updateExamSessionDto: UpdateExamSessionDto) {
    return this.examSessionsService.update(+id, updateExamSessionDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Delete(":id")
  @ApiOperation({ summary: "Delete exam by ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, description: "Exam deleted successfully" })
  @ApiResponse({ status: 404, description: "Exam not found" })
  remove(@Param("id") id: string) {
    return this.examSessionsService.remove(+id);
  }
}
