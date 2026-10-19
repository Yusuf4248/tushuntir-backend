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
import { CreateClassStudentDto } from "./dto/create-class-student.dto";
import { ClassStudentQueryDto } from "./dto/class-student-query.dto";
import { UpdateClassStudentDto } from "./dto/update-class-student.dto";
import { ClassStudent } from "./entities/class-student.entity";
import { ClassStudentsService } from "./class-students.service";

@ApiTags("School · Class students")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("class-students")
export class ClassStudentsController {
  constructor(private readonly classStudentsService: ClassStudentsService) {}

  @Post()
  @ApiOperation({ summary: "Create a class enrolment" })
  @ApiCreatedResponse({ type: ClassStudent })
  create(@Body() dto: CreateClassStudentDto, @CurrentUser() user: AuthUser) {
    return this.classStudentsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List class enrolments" })
  @ApiPaginatedResponse(ClassStudent)
  findAll(@Query() query: ClassStudentQueryDto, @CurrentUser() user: AuthUser) {
    return this.classStudentsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a class enrolment" })
  @ApiOkResponse({ type: ClassStudent })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classStudentsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a class enrolment" })
  @ApiOkResponse({ type: ClassStudent })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateClassStudentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classStudentsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a class enrolment" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.classStudentsService.remove(id, user);
  }
}
