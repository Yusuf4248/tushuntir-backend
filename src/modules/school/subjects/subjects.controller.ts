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
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { SubjectQueryDto } from "./dto/subject-query.dto";
import { UpdateSubjectDto } from "./dto/update-subject.dto";
import { Subject } from "./entities/subject.entity";
import { SubjectsService } from "./subjects.service";

@ApiTags("School · Subjects")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("subjects")
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Create a subject" })
  @ApiCreatedResponse({ type: Subject })
  create(@Body() dto: CreateSubjectDto, @CurrentUser() user: AuthUser) {
    return this.subjectsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List subjects" })
  @ApiPaginatedResponse(Subject)
  findAll(@Query() query: SubjectQueryDto, @CurrentUser() user: AuthUser) {
    return this.subjectsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a subject" })
  @ApiOkResponse({ type: Subject })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subjectsService.findOne(id, user);
  }

  @Patch(":id")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Update a subject" })
  @ApiOkResponse({ type: Subject })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateSubjectDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subjectsService.update(id, dto, user);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a subject" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.subjectsService.remove(id, user);
  }
}
