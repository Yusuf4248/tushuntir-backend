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
import { CreateTimetableSlotDto } from "./dto/create-timetable-slot.dto";
import { TimetableSlotQueryDto } from "./dto/timetable-slot-query.dto";
import { UpdateTimetableSlotDto } from "./dto/update-timetable-slot.dto";
import { TimetableSlot } from "./entities/timetable-slot.entity";
import { TimetableSlotsService } from "./timetable-slots.service";

@ApiTags("School · Timetable slots")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("timetable-slots")
export class TimetableSlotsController {
  constructor(private readonly timetableSlotsService: TimetableSlotsService) {}

  @Post()
  @ApiOperation({ summary: "Create a timetable slot" })
  @ApiCreatedResponse({ type: TimetableSlot })
  create(@Body() dto: CreateTimetableSlotDto, @CurrentUser() user: AuthUser) {
    return this.timetableSlotsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List timetable slots" })
  @ApiPaginatedResponse(TimetableSlot)
  findAll(
    @Query() query: TimetableSlotQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.timetableSlotsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a timetable slot" })
  @ApiOkResponse({ type: TimetableSlot })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.timetableSlotsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a timetable slot" })
  @ApiOkResponse({ type: TimetableSlot })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateTimetableSlotDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.timetableSlotsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a timetable slot" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.timetableSlotsService.remove(id, user);
  }
}
