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
} from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import { Roles } from "../app.constants";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/role.guard";
import { UpdateLessonAttendancesDto } from "./dto/update-lesson-attendances-dto";

@ApiTags("Attendance")
@ApiBearerAuth("JWT-auth")
@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Post()
  @ApiOperation({ summary: "Yangi davomat yozuvini yaratish" })
  @ApiResponse({ status: 201, description: "Davomat yozuvi yaratildi" })
  @ApiResponse({ status: 400, description: "Yaroqsiz ma’lumotlar" })
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.create(createAttendanceDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Get()
  @ApiOperation({ summary: "Barcha davomat yozuvlarini olish" })
  @ApiResponse({ status: 200, description: "Davomatlar ro'yxati" })
  findAll() {
    return this.attendanceService.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Get(":id")
  @ApiOperation({ summary: "Bitta davomat yozuvini olish" })
  @ApiResponse({ status: 200, description: "Topilgan davomat yozuvi" })
  @ApiResponse({ status: 404, description: "Topilmadi" })
  findOne(@Param("id") id: string) {
    return this.attendanceService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Patch(":id")
  @ApiOperation({ summary: "Davomat yozuvini yangilash" })
  @ApiResponse({ status: 200, description: "Muvaffaqiyatli yangilandi" })
  @ApiResponse({ status: 404, description: "Yozuv topilmadi" })
  update(
    @Param("id") id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto
  ) {
    return this.attendanceService.update(+id, updateAttendanceDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Delete(":id")
  @ApiOperation({ summary: "Davomat yozuvini o'chirish" })
  @ApiResponse({ status: 200, description: "Yozuv o'chirildi" })
  @ApiResponse({ status: 404, description: "Yozuv topilmadi" })
  remove(@Param("id") id: string) {
    return this.attendanceService.remove(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("teacher")
  @Post("bulk-update")
  @ApiOperation({
    summary: "Dars davomatini ommaviy yangilash",
    description:
      "Bir darsdagi bir nechta o'quvchilar uchun davomat yozuvlarini yangilaydi.",
  })
  @ApiBody({
    type: UpdateLessonAttendancesDto,
    description: "Dars uchun davomat ma’lumotlari",
  })
  @ApiResponse({
    status: 200,
    description: "Davomat muvaffaqiyatli yangilandi",
    schema: {
      example: {
        message: "Davomat muvaffaqiyatli yangilandi",
        success: true,
        data: {
          lessonId: 101,
          lessonTitle: "Matematika darsi",
          students: [
            { studentId: 1, status: "came" },
            { studentId: 2, status: "did not came" },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Noto'g'ri so'rov - Xato kiritilgan ma’lumotlar",
    schema: {
      example: {
        statusCode: 400,
        message: [
          "property lessonTitle should not exist",
          "property students should not exist",
        ],
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Ichki server xatosi",
    schema: {
      example: {
        message: "Ichki server xatosi",
        error: "Internal Server Error",
        statusCode: 500,
      },
    },
  })
  async bulkUpdate(@Body() updateDto: UpdateLessonAttendancesDto) {
    return this.attendanceService.updateAttendanceForGroup(updateDto);
  }

  @Get("student/:studentId/group/:groupId")
  @ApiOperation({ summary: "Get all attendances of a student in a group" })
  @ApiParam({
    name: "studentId",
    type: Number,
    description: "ID of the student",
  })
  @ApiParam({ name: "groupId", type: Number, description: "ID of the group" })
  @ApiResponse({ status: 200, description: "List of attendances" })
  async getStudentAllAttendances(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("groupId", ParseIntPipe) groupId: number
  ) {
    return this.attendanceService.getStudentAllAttendances(studentId, groupId);
  }

  @Get("lesson/:lessonId")
  @ApiOperation({ summary: "Get all attendances by lesson ID" })
  @ApiParam({ name: "lessonId", type: Number, description: "ID of the lesson" })
  @ApiResponse({
    status: 200,
    description: "List of student attendances for the lesson",
  })
  async getAttendancesByLesson(
    @Param("lessonId", ParseIntPipe) lessonId: number
  ) {
    return this.attendanceService.getAttendancesByLesson(lessonId);
  }
}
