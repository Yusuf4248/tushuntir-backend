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
import { CreateGradeDto } from "./dto/create-grade.dto";
import { GradeQueryDto } from "./dto/grade-query.dto";
import { UpdateGradeDto } from "./dto/update-grade.dto";
import { Grade } from "./entities/grade.entity";
import { GradesService } from "./grades.service";

@ApiTags("Daily · Grades")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("grades")
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @ApiOperation({ summary: "Create a grade" })
  @ApiCreatedResponse({ type: Grade })
  create(@Body() dto: CreateGradeDto, @CurrentUser() user: AuthUser) {
    return this.gradesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List grades" })
  @ApiPaginatedResponse(Grade)
  findAll(@Query() query: GradeQueryDto, @CurrentUser() user: AuthUser) {
    return this.gradesService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a grade" })
  @ApiOkResponse({ type: Grade })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.gradesService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a grade" })
  @ApiOkResponse({ type: Grade })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateGradeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.gradesService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a grade" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.gradesService.remove(id, user);
  }
}
