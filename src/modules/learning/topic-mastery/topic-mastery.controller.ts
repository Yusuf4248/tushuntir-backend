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
import { CreateTopicMasteryDto } from "./dto/create-topic-mastery.dto";
import { TopicMasteryQueryDto } from "./dto/topic-mastery-query.dto";
import { UpdateTopicMasteryDto } from "./dto/update-topic-mastery.dto";
import { TopicMastery } from "./entities/topic-mastery.entity";
import { TopicMasteryService } from "./topic-mastery.service";

@ApiTags("Learning · Topic mastery")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("topic-mastery")
export class TopicMasteryController {
  constructor(private readonly topicMasteryService: TopicMasteryService) {}

  @Post()
  @ApiOperation({ summary: "Create a topic mastery record" })
  @ApiCreatedResponse({ type: TopicMastery })
  create(@Body() dto: CreateTopicMasteryDto, @CurrentUser() user: AuthUser) {
    return this.topicMasteryService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List topic mastery records" })
  @ApiPaginatedResponse(TopicMastery)
  findAll(@Query() query: TopicMasteryQueryDto, @CurrentUser() user: AuthUser) {
    return this.topicMasteryService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a topic mastery record" })
  @ApiOkResponse({ type: TopicMastery })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.topicMasteryService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a topic mastery record" })
  @ApiOkResponse({ type: TopicMastery })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateTopicMasteryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.topicMasteryService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a topic mastery record" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.topicMasteryService.remove(id, user);
  }
}
