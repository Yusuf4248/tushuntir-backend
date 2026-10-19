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
import { CreateHomeworkDto } from "./dto/create-homework.dto";
import { HomeworkQueryDto } from "./dto/homework-query.dto";
import { UpdateHomeworkDto } from "./dto/update-homework.dto";
import { Homework } from "./entities/homework.entity";
import { HomeworkService } from "./homework.service";

@ApiTags("Homework · Homework")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("homework")
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post()
  @ApiOperation({ summary: "Create homework" })
  @ApiCreatedResponse({ type: Homework })
  create(@Body() dto: CreateHomeworkDto, @CurrentUser() user: AuthUser) {
    return this.homeworkService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List homework" })
  @ApiPaginatedResponse(Homework)
  findAll(@Query() query: HomeworkQueryDto, @CurrentUser() user: AuthUser) {
    return this.homeworkService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get homework" })
  @ApiOkResponse({ type: Homework })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.homeworkService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update homework" })
  @ApiOkResponse({ type: Homework })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateHomeworkDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.homeworkService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete homework" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.homeworkService.remove(id, user);
  }
}
