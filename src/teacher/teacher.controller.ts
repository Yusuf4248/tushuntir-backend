import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Res,
  UseInterceptors,
  UploadedFile,
  Query,
} from "@nestjs/common";
import { TeacherService } from "./teacher.service";
import { CreateTeacherDto } from "./dto/create-teacher.dto";
import { UpdateTeacherDto } from "./dto/update-teacher.dto";
import { ChangePasswordDto } from "../student/dto/change-password.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from "@nestjs/swagger";
import { Teacher } from "./entities/teacher.entity";
import { Roles } from "../app.constants";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/role.guard";
import { JwtSelfGuard } from "../common/guards/jwt-self.guard";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";

@ApiTags("Teacher")
@ApiBearerAuth("JWT-auth")
@Controller("teacher")
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Post()
  @ApiOperation({ summary: "Create a new teacher" })
  @ApiResponse({ status: 201, type: Teacher })
  @ApiBody({ type: CreateTeacherDto })
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teacherService.create(createTeacherDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Get()
  @ApiOperation({ summary: "Get all teachers" })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, type: [Teacher] })
  findAll(@Query("page") page = 1, @Query("limit") limit = 10) {
    return this.teacherService.findAll(Number(page), Number(limit));
  }

  @UseGuards(AuthGuard, RolesGuard, JwtSelfGuard)
  @Roles("superadmin", "admin", "teacher")
  @Get(":id")
  @ApiOperation({ summary: "Get teacher by ID" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200, type: Teacher })
  findOne(@Param("id") id: string) {
    return this.teacherService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard, JwtSelfGuard)
  @Roles("superadmin", "admin", "teacher")
  @Patch(":id")
  @ApiOperation({ summary: "Update teacher by ID" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({ type: UpdateTeacherDto })
  @ApiResponse({ status: 200, type: Teacher })
  update(@Param("id") id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teacherService.update(+id, updateTeacherDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Delete(":id")
  @ApiOperation({ summary: "Delete teacher by ID" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200 })
  remove(@Param("id") id: string) {
    return this.teacherService.remove(+id);
  }

  @UseGuards(AuthGuard, RolesGuard, JwtSelfGuard)
  @Roles("superadmin", "admin", "teacher")
  @Patch("change-password/:id")
  @ApiOperation({ summary: "Change teacher password" })
  @ApiParam({ name: "id", type: String })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: "Password updated successfully" })
  changePassword(
    @Param("id") id: string,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return this.teacherService.changePassword(+id, changePasswordDto);
  }

  @UseGuards(AuthGuard, RolesGuard, JwtSelfGuard)
  @Roles("superadmin", "admin", "teacher")
  @Post(":id/avatar")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Teacher avatarini yuklash" })
  @ApiParam({
    name: "id",
    type: Number,
    example: 1,
    description: "O'qituvchi ID raqami",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Avatar faylni multipart/form-data formatida yuboring",
    required: true,
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Yuklanayotgan avatar fayl (.jpg, .png, ...)",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "✅ Avatar muvaffaqiyatli yuklandi",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        message: { type: "string", example: "Avatar uploaded successfully" },
        data: {
          type: "object",
          properties: {
            avatarUrl: {
              type: "string",
              example: "https://example.com/uploads/avatar_123.jpg",
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "❌ Xatolik: Fayl yuborilmagan yoki noto'g'ri formatda",
  })
  @ApiResponse({
    status: 403,
    description: "❌ Ruxsat yo'q (faqat superadmin, admin, teacher)",
  })
  async uploadAvatar(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.teacherService.uploadAvatar(id, file);
  }

  @Get(":id/avatar/view")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin", "teacher")
  @ApiOperation({ summary: "Studentning rasm faylini ko'rish" })
  @ApiParam({
    name: "id",
    type: Number,
    example: 1,
    description: "Student ID raqami",
  })
  @ApiResponse({
    status: 200,
    description: "Rasm muvaffaqiyatli yuborildi (image/png yoki image/jpeg)",
  })
  @ApiResponse({ status: 404, description: "Student yoki avatar topilmadi" })
  async viewAvatar(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response
  ) {
    return this.teacherService.viewAvatar(+id, res);
  }
}
