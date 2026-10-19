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
import { CreateAcademicYearDto } from "./dto/create-academic-year.dto";
import { AcademicYearQueryDto } from "./dto/academic-year-query.dto";
import { UpdateAcademicYearDto } from "./dto/update-academic-year.dto";
import { AcademicYear } from "./entities/academic-year.entity";
import { AcademicYearsService } from "./academic-years.service";

@ApiTags("School · Academic years")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("academic-years")
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Post()
  @ApiOperation({ summary: "Create an academic year" })
  @ApiCreatedResponse({ type: AcademicYear })
  create(@Body() dto: CreateAcademicYearDto, @CurrentUser() user: AuthUser) {
    return this.academicYearsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List academic years" })
  @ApiPaginatedResponse(AcademicYear)
  findAll(@Query() query: AcademicYearQueryDto, @CurrentUser() user: AuthUser) {
    return this.academicYearsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an academic year" })
  @ApiOkResponse({ type: AcademicYear })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.academicYearsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an academic year" })
  @ApiOkResponse({ type: AcademicYear })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateAcademicYearDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.academicYearsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an academic year" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.academicYearsService.remove(id, user);
  }
}
