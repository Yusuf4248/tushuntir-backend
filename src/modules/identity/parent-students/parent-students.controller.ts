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
import { CreateParentStudentDto } from "./dto/create-parent-student.dto";
import { ParentStudentQueryDto } from "./dto/parent-student-query.dto";
import { UpdateParentStudentDto } from "./dto/update-parent-student.dto";
import { ParentStudent } from "./entities/parent-student.entity";
import { ParentStudentsService } from "./parent-students.service";

@ApiTags("Identity · Parent students")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("parent-students")
export class ParentStudentsController {
  constructor(private readonly parentStudentsService: ParentStudentsService) {}

  @Post()
  @ApiOperation({ summary: "Create a parent link" })
  @ApiCreatedResponse({ type: ParentStudent })
  create(@Body() dto: CreateParentStudentDto, @CurrentUser() user: AuthUser) {
    return this.parentStudentsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List parent links" })
  @ApiPaginatedResponse(ParentStudent)
  findAll(
    @Query() query: ParentStudentQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.parentStudentsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a parent link" })
  @ApiOkResponse({ type: ParentStudent })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.parentStudentsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a parent link" })
  @ApiOkResponse({ type: ParentStudent })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateParentStudentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.parentStudentsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a parent link" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.parentStudentsService.remove(id, user);
  }
}
