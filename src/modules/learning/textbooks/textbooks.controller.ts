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
import { CreateTextbookDto } from "./dto/create-textbook.dto";
import { TextbookQueryDto } from "./dto/textbook-query.dto";
import { UpdateTextbookDto } from "./dto/update-textbook.dto";
import { Textbook } from "./entities/textbook.entity";
import { TextbooksService } from "./textbooks.service";

@ApiTags("Learning · Textbooks")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("textbooks")
export class TextbooksController {
  constructor(private readonly textbooksService: TextbooksService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Create a textbook" })
  @ApiCreatedResponse({ type: Textbook })
  create(@Body() dto: CreateTextbookDto, @CurrentUser() user: AuthUser) {
    return this.textbooksService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List textbooks" })
  @ApiPaginatedResponse(Textbook)
  findAll(@Query() query: TextbookQueryDto, @CurrentUser() user: AuthUser) {
    return this.textbooksService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a textbook" })
  @ApiOkResponse({ type: Textbook })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.textbooksService.findOne(id, user);
  }

  @Patch(":id")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Update a textbook" })
  @ApiOkResponse({ type: Textbook })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateTextbookDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.textbooksService.update(id, dto, user);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a textbook" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.textbooksService.remove(id, user);
  }
}
