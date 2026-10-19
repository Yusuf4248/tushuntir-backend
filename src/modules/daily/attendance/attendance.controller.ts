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
import { BulkAttendanceDto } from "./dto/bulk-attendance.dto";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { AttendanceQueryDto } from "./dto/attendance-query.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";
import { Attendance } from "./entities/attendance.entity";
import { AttendanceService } from "./attendance.service";

@ApiTags("Daily · Attendance")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post("bulk")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Set attendance for a whole lesson",
    description:
      "Creates or updates one record per student (unique per lesson and student). Every student must be enrolled in the lesson's class.",
  })
  @ApiOkResponse({ type: [Attendance] })
  bulk(@Body() dto: BulkAttendanceDto, @CurrentUser() user: AuthUser) {
    return this.attendanceService.bulkUpsert(dto, user);
  }

  @Post()
  @ApiOperation({ summary: "Create an attendance record" })
  @ApiCreatedResponse({ type: Attendance })
  create(@Body() dto: CreateAttendanceDto, @CurrentUser() user: AuthUser) {
    return this.attendanceService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List attendance records" })
  @ApiPaginatedResponse(Attendance)
  findAll(@Query() query: AttendanceQueryDto, @CurrentUser() user: AuthUser) {
    return this.attendanceService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an attendance record" })
  @ApiOkResponse({ type: Attendance })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attendanceService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an attendance record" })
  @ApiOkResponse({ type: Attendance })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateAttendanceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attendanceService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an attendance record" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.attendanceService.remove(id, user);
  }
}
