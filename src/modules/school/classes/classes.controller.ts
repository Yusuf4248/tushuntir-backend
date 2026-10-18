import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { Query } from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";
import { ClassesService } from "./classes.service";
import { CreateSchoolClassDto } from "./dto/create-school-class.dto";
import { UpdateSchoolClassDto } from "./dto/update-school-class.dto";
import { SchoolClass } from "./entities/school-class.entity";
import { Roles } from "../../../app.constants";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/role.guard";

@ApiTags("Classes")
@ApiBearerAuth("JWT-auth")
@Controller("classes")
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Post()
  @ApiOperation({ summary: "Yangi class yaratish" })
  @ApiResponse({ status: 201, description: "Class yaratildi", type: SchoolClass })
  async create(@Body() createSchoolClassDto: CreateSchoolClassDto) {
    return this.classesService.create(createSchoolClassDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Get()
  @ApiOperation({ summary: "Barcha sinflarni olish (pagination bilan)" })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: "Sinflar ro'yxati", type: [SchoolClass] })
  async findAll(@Query("page") page = 1, @Query("limit") limit = 10) {
    return this.classesService.findAll(Number(page), Number(limit));
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Get(":id")
  @ApiOperation({ summary: "ID bo'yicha class olish" })
  @ApiResponse({ status: 200, description: "Class topildi", type: SchoolClass })
  async findOne(@Param("id") id: string) {
    return this.classesService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Patch(":id")
  @ApiOperation({ summary: "Sinfni tahrirlash" })
  @ApiResponse({ status: 200, description: "Class yangilandi", type: SchoolClass })
  async update(
    @Param("id") id: string,
    @Body() updateSchoolClassDto: UpdateSchoolClassDto
  ) {
    return this.classesService.update(+id, updateSchoolClassDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Delete(":id")
  @ApiOperation({ summary: "Sinfni o'chirish" })
  @ApiResponse({ status: 200, description: "Class o'chirildi" })
  async remove(@Param("id") id: string) {
    return this.classesService.remove(+id);
  }

  @Get("/search/:className")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("admin", "superadmin")
  @ApiOperation({ summary: "Guruhni nomi orqali olish" })
  @ApiParam({ name: "className", type: String, description: "Guruh nomi" })
  @ApiResponse({ status: 200, description: "Topilgan guruh" })
  @ApiResponse({ status: 404, description: "Guruh topilmadi" })
  async getClassByName(@Param("className") className: string) {
    return this.classesService.getClassByName(className);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("teacher")
  @Get(":id/teacher")
  @ApiOperation({
    summary: "Get class details for a teacher by ID",
    description:
      "Retrieves detailed information about a class, including its teachers, students, and lessons, for a specific class ID.",
  })
  @ApiParam({
    name: "id",
    description: "ID of the class",
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Class details retrieved successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid class ID",
    schema: {
      example: {
        message: "ID must be a positive integer",
        error: "Bad Request",
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Class not found",
    schema: {
      example: {
        message: "Class ID-1 not found",
        error: "Not Found",
        statusCode: 404,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error",
    schema: {
      example: {
        message: "Internal server error",
        error: "Internal Server Error",
        statusCode: 500,
      },
    },
  })
  async findOneClassForTeacher(@Param("id", ParseIntPipe) id: number) {
    return this.classesService.findOneClassForTeacher(id);
  }
}
