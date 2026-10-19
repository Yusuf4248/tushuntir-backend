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
import { CreateSchoolDto } from "./dto/create-school.dto";
import { SchoolQueryDto } from "./dto/school-query.dto";
import { UpdateSchoolDto } from "./dto/update-school.dto";
import { School } from "./entities/school.entity";
import { SchoolsService } from "./schools.service";

@ApiTags("School · Schools")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("schools")
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Create a school" })
  @ApiCreatedResponse({ type: School })
  create(@Body() dto: CreateSchoolDto, @CurrentUser() user: AuthUser) {
    return this.schoolsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List schools" })
  @ApiPaginatedResponse(School)
  findAll(@Query() query: SchoolQueryDto, @CurrentUser() user: AuthUser) {
    return this.schoolsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a school" })
  @ApiOkResponse({ type: School })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schoolsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a school" })
  @ApiOkResponse({ type: School })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateSchoolDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schoolsService.update(id, dto, user);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a school" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.schoolsService.remove(id, user);
  }
}
