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
import { CreateChapterDto } from "./dto/create-chapter.dto";
import { ChapterQueryDto } from "./dto/chapter-query.dto";
import { UpdateChapterDto } from "./dto/update-chapter.dto";
import { Chapter } from "./entities/chapter.entity";
import { ChaptersService } from "./chapters.service";

@ApiTags("Learning · Chapters")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("chapters")
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Create a chapter" })
  @ApiCreatedResponse({ type: Chapter })
  create(@Body() dto: CreateChapterDto, @CurrentUser() user: AuthUser) {
    return this.chaptersService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List chapters" })
  @ApiPaginatedResponse(Chapter)
  findAll(@Query() query: ChapterQueryDto, @CurrentUser() user: AuthUser) {
    return this.chaptersService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a chapter" })
  @ApiOkResponse({ type: Chapter })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chaptersService.findOne(id, user);
  }

  @Patch(":id")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Update a chapter" })
  @ApiOkResponse({ type: Chapter })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateChapterDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chaptersService.update(id, dto, user);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a chapter" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.chaptersService.remove(id, user);
  }
}
