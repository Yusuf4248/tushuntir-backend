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
import { CreateAiSessionDto } from "./dto/create-ai-session.dto";
import { AiSessionQueryDto } from "./dto/ai-session-query.dto";
import { UpdateAiSessionDto } from "./dto/update-ai-session.dto";
import { AiSession } from "./entities/ai-session.entity";
import { AiSessionsService } from "./ai-sessions.service";

@ApiTags("Learning · AI sessions")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("ai-sessions")
export class AiSessionsController {
  constructor(private readonly aiSessionsService: AiSessionsService) {}

  @Post()
  @ApiOperation({ summary: "Create an AI session" })
  @ApiCreatedResponse({ type: AiSession })
  create(@Body() dto: CreateAiSessionDto, @CurrentUser() user: AuthUser) {
    return this.aiSessionsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List AI sessions" })
  @ApiPaginatedResponse(AiSession)
  findAll(@Query() query: AiSessionQueryDto, @CurrentUser() user: AuthUser) {
    return this.aiSessionsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an AI session" })
  @ApiOkResponse({ type: AiSession })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.aiSessionsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an AI session" })
  @ApiOkResponse({ type: AiSession })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateAiSessionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.aiSessionsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an AI session" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.aiSessionsService.remove(id, user);
  }
}
