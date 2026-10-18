import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ParseIntPipe,
  UploadedFile,
  UseGuards,
  Res,
  Query,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiQuery,
} from "@nestjs/swagger";

import { StudentService } from "./student.service";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { Multer } from "multer";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/role.guard";
import { JwtSelfGuard } from "../common/guards/jwt-self.guard";
import { Roles } from "../app.constants";
import { Response } from "express";

@ApiTags("Students")
@ApiBearerAuth("JWT-auth")
@Controller("students")
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Post()
  @ApiOperation({ summary: "Yangi student qo'shish (adminlar uchun)" })
  @ApiBody({ type: CreateStudentDto })
  @ApiResponse({ status: 201, description: "Student muvaffaqiyatli yaratildi" })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Get()
  @ApiOperation({ summary: "Barcha studentlarni olish (adminlar uchun)" })
  @ApiResponse({ status: 200, description: "Barcha studentlar ro'yxati" })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  findAll(@Query("page") page: number, @Query("limit") limit: number) {
    return this.studentService.findAll(page, limit);
  }

  @UseGuards(AuthGuard, RolesGuard, JwtSelfGuard)
  @Roles("superadmin", "admin", "student")
  @Get(":id")
  @ApiOperation({ summary: "Studentni ID bo'yicha olish" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "Topilgan student" })
  @ApiResponse({ status: 404, description: "Student topilmadi" })
  findOne(@Param("id") id: string) {
    return this.studentService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard, JwtSelfGuard)
  @Roles("superadmin", "admin", "student")
  @Patch(":id")
  @ApiOperation({ summary: "Student ma'lumotlarini tahrirlash" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiBody({ type: UpdateStudentDto })
  @ApiResponse({ status: 200, description: "Student yangilandi" })
  update(@Param("id") id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.update(+id, updateStudentDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Delete(":id")
  @ApiOperation({ summary: "Studentni o'chirish" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "Student o'chirildi" })
  @ApiResponse({ status: 404, description: "Student topilmadi" })
  remove(@Param("id") id: string) {
    return this.studentService.remove(+id);
  }

  @UseGuards(AuthGuard, RolesGuard, JwtSelfGuard)
  @Roles("superadmin", "admin", "student")
  @Patch("change-password/:id")
  @ApiOperation({
    summary: "Parolni o'zgartirish (o'ziga tegishli foydalanuvchi)",
  })
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: "Parol muvaffaqiyatli o'zgartirildi",
  })
  @ApiResponse({
    status: 400,
    description: "Eski parol noto'g'ri yoki boshqa xatolik",
  })
  changePassword(
    @Param("id") id: string,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return this.studentService.changePassword(+id, changePasswordDto);
  }

  @UseGuards(AuthGuard, RolesGuard, JwtSelfGuard)
  @Roles("superadmin", "admin", "student")
  @Post(":id/avatar")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Student avatarini yuklash" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 200, description: "Avatar muvaffaqiyatli yuklandi" })
  async uploadAvatar(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.studentService.uploadAvatar(id, file);
  }

  @Get(":id/avatar/view")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin", "student")
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
    return this.studentService.viewAvatar(+id, res);
  }

  // @Get(":studentId/class/:classId")
  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles("student", "admin", "superadmin", "teacher")
  // @ApiOperation({
  //   summary: "Talabaning guruhiga tegishli barcha vazifalarni olish",
  // })
  // @ApiParam({
  //   name: "studentId",
  //   type: Number,
  //   example: 5,
  //   description: "Student ID",
  // })
  // @ApiParam({
  //   name: "classId",
  //   type: Number,
  //   example: 3,
  //   description: "SchoolClass ID",
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: "Ushbu student uchun guruhdagi uyga vazifalar",
  //   type: [Homework],
  // })
  // getAllStudentHomeworksByClass(
  //   @Param("studentId") studentId: number,
  //   @Param("classId") classId: number,
  //   @Query("page") page = 1,
  //   @Query("limit") limit = 10,
  //   @Query("status") status: HomeworkStatus
  // ) {
  //   return this.studentService.getStudentHomeworksByClass(
  //     studentId,
  //     classId,
  //     page,
  //     limit,
  //     status
  //   );
  // }

  // @Get(":id/classes")
  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles("student", "admin", "superadmin")
  // getStudentAllClasses(@Param("id", ParseIntPipe) id: number) {
  //   return this.studentService.findStudentAllClasses(id);
  // }
}
