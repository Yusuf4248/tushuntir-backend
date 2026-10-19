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
import { CreateTextbookChunkDto } from "./dto/create-textbook-chunk.dto";
import { TextbookChunkQueryDto } from "./dto/textbook-chunk-query.dto";
import { UpdateTextbookChunkDto } from "./dto/update-textbook-chunk.dto";
import { TextbookChunk } from "./entities/textbook-chunk.entity";
import { TextbookChunksService } from "./textbook-chunks.service";

@ApiTags("Learning · Textbook chunks")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("textbook-chunks")
export class TextbookChunksController {
  constructor(private readonly textbookChunksService: TextbookChunksService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Create a textbook chunk" })
  @ApiCreatedResponse({ type: TextbookChunk })
  create(@Body() dto: CreateTextbookChunkDto, @CurrentUser() user: AuthUser) {
    return this.textbookChunksService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List textbook chunks" })
  @ApiPaginatedResponse(TextbookChunk)
  findAll(
    @Query() query: TextbookChunkQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.textbookChunksService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a textbook chunk" })
  @ApiOkResponse({ type: TextbookChunk })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.textbookChunksService.findOne(id, user);
  }

  @Patch(":id")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Update a textbook chunk" })
  @ApiOkResponse({ type: TextbookChunk })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateTextbookChunkDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.textbookChunksService.update(id, dto, user);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a textbook chunk" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.textbookChunksService.remove(id, user);
  }
}
