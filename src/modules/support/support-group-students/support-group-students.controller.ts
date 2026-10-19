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
import { CreateSupportGroupStudentDto } from "./dto/create-support-group-student.dto";
import { SupportGroupStudentQueryDto } from "./dto/support-group-student-query.dto";
import { UpdateSupportGroupStudentDto } from "./dto/update-support-group-student.dto";
import { SupportGroupStudent } from "./entities/support-group-student.entity";
import { SupportGroupStudentsService } from "./support-group-students.service";

@ApiTags("Support · Support group students")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("support-group-students")
export class SupportGroupStudentsController {
  constructor(
    private readonly supportGroupStudentsService: SupportGroupStudentsService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a support group student" })
  @ApiCreatedResponse({ type: SupportGroupStudent })
  create(
    @Body() dto: CreateSupportGroupStudentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.supportGroupStudentsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List support group students" })
  @ApiPaginatedResponse(SupportGroupStudent)
  findAll(
    @Query() query: SupportGroupStudentQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.supportGroupStudentsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a support group student" })
  @ApiOkResponse({ type: SupportGroupStudent })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.supportGroupStudentsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a support group student" })
  @ApiOkResponse({ type: SupportGroupStudent })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateSupportGroupStudentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.supportGroupStudentsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a support group student" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.supportGroupStudentsService.remove(id, user);
  }
}
