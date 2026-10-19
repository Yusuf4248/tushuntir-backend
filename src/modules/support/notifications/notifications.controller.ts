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
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { NotificationQueryDto } from "./dto/notification-query.dto";
import { UpdateNotificationDto } from "./dto/update-notification.dto";
import { Notification } from "./entities/notification.entity";
import { NotificationsService } from "./notifications.service";

@ApiTags("Support · Notifications")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: "Create a notification" })
  @ApiCreatedResponse({ type: Notification })
  create(@Body() dto: CreateNotificationDto, @CurrentUser() user: AuthUser) {
    return this.notificationsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List notifications" })
  @ApiPaginatedResponse(Notification)
  findAll(@Query() query: NotificationQueryDto, @CurrentUser() user: AuthUser) {
    return this.notificationsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a notification" })
  @ApiOkResponse({ type: Notification })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.notificationsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a notification" })
  @ApiOkResponse({ type: Notification })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateNotificationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.notificationsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a notification" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.notificationsService.remove(id, user);
  }
}
