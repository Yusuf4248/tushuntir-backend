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
import { ADMIN_PANEL_ROLES, UserRole } from "../../../common/enums";
import {
  ApiErrorResponses,
  ApiPaginatedResponse,
} from "../../../common/swagger/api-responses.decorator";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { TopicQueryDto } from "./dto/topic-query.dto";
import { UpdateTopicDto } from "./dto/update-topic.dto";
import { Topic } from "./entities/topic.entity";
import { TopicsService } from "./topics.service";

@ApiTags("Learning · Topics")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("topics")
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Create a topic" })
  @ApiCreatedResponse({ type: Topic })
  create(@Body() dto: CreateTopicDto, @CurrentUser() user: AuthUser) {
    return this.topicsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List topics" })
  @ApiPaginatedResponse(Topic)
  findAll(@Query() query: TopicQueryDto, @CurrentUser() user: AuthUser) {
    return this.topicsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a topic" })
  @ApiOkResponse({ type: Topic })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.topicsService.findOne(id, user);
  }

  @Patch(":id")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Update a topic" })
  @ApiOkResponse({ type: Topic })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateTopicDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.topicsService.update(id, dto, user);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a topic" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.topicsService.remove(id, user);
  }
}
