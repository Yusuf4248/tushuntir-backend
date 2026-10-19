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
import { CreateRoomDto } from "./dto/create-room.dto";
import { RoomQueryDto } from "./dto/room-query.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";
import { Room } from "./entities/room.entity";
import { RoomsService } from "./rooms.service";

@ApiTags("School · Rooms")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: "Create a room" })
  @ApiCreatedResponse({ type: Room })
  create(@Body() dto: CreateRoomDto, @CurrentUser() user: AuthUser) {
    return this.roomsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List rooms" })
  @ApiPaginatedResponse(Room)
  findAll(@Query() query: RoomQueryDto, @CurrentUser() user: AuthUser) {
    return this.roomsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a room" })
  @ApiOkResponse({ type: Room })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.roomsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a room" })
  @ApiOkResponse({ type: Room })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateRoomDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.roomsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a room" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.roomsService.remove(id, user);
  }
}
