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
import { CreateSchoolClassDto } from "./dto/create-school-class.dto";
import { SchoolClassQueryDto } from "./dto/school-class-query.dto";
import { UpdateSchoolClassDto } from "./dto/update-school-class.dto";
import { SchoolClass } from "./entities/school-class.entity";
import { ClassesService } from "./classes.service";

@ApiTags("School · Classes")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("classes")
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @ApiOperation({ summary: "Create a class" })
  @ApiCreatedResponse({ type: SchoolClass })
  create(@Body() dto: CreateSchoolClassDto, @CurrentUser() user: AuthUser) {
    return this.classesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List classes" })
  @ApiPaginatedResponse(SchoolClass)
  findAll(@Query() query: SchoolClassQueryDto, @CurrentUser() user: AuthUser) {
    return this.classesService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a class" })
  @ApiOkResponse({ type: SchoolClass })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classesService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a class" })
  @ApiOkResponse({ type: SchoolClass })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateSchoolClassDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classesService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a class" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.classesService.remove(id, user);
  }
}
