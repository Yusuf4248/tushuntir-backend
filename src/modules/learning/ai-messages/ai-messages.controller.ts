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
import { CreateAiMessageDto } from "./dto/create-ai-message.dto";
import { AiMessageQueryDto } from "./dto/ai-message-query.dto";
import { UpdateAiMessageDto } from "./dto/update-ai-message.dto";
import { AiMessage } from "./entities/ai-message.entity";
import { AiMessagesService } from "./ai-messages.service";

@ApiTags("Learning · AI messages")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("ai-messages")
export class AiMessagesController {
  constructor(private readonly aiMessagesService: AiMessagesService) {}

  @Post()
  @ApiOperation({ summary: "Create an AI message" })
  @ApiCreatedResponse({ type: AiMessage })
  create(@Body() dto: CreateAiMessageDto, @CurrentUser() user: AuthUser) {
    return this.aiMessagesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List AI messages" })
  @ApiPaginatedResponse(AiMessage)
  findAll(@Query() query: AiMessageQueryDto, @CurrentUser() user: AuthUser) {
    return this.aiMessagesService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an AI message" })
  @ApiOkResponse({ type: AiMessage })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.aiMessagesService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an AI message" })
  @ApiOkResponse({ type: AiMessage })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateAiMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.aiMessagesService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an AI message" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.aiMessagesService.remove(id, user);
  }
}
