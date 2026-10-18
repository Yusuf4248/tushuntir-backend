import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { SchoolsService } from "./schools.service";
import { CreateSchoolDto } from "./dto/create-school.dto";
import { UpdateSchoolDto } from "./dto/update-school.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Roles } from "../../../app.constants";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/role.guard";

@ApiTags("Schools")
@Controller("schools")
@ApiBearerAuth("JWT-auth")
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Post()
  @ApiOperation({ summary: "Yangi filial yaratish" })
  @ApiBody({ type: CreateSchoolDto })
  @ApiResponse({ status: 201, description: "Filial yaratildi" })
  create(@Body() createSchoolDto: CreateSchoolDto) {
    return this.schoolsService.create(createSchoolDto);
  }

  @Get()
  @ApiOperation({ summary: "Barcha filiallarni olish" })
  @ApiResponse({ status: 200, description: "Filiallar ro'yxati" })
  findAll() {
    return this.schoolsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Bitta filialni ID orqali olish" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "Topilgan filial" })
  findOne(@Param("id") id: string) {
    return this.schoolsService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Patch(":id")
  @ApiOperation({ summary: "Filialni yangilash" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiBody({ type: UpdateSchoolDto })
  @ApiResponse({ status: 200, description: "Filial yangilandi" })
  update(@Param("id") id: string, @Body() updateSchoolDto: UpdateSchoolDto) {
    return this.schoolsService.update(+id, updateSchoolDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles("superadmin", "admin")
  @Delete(":id")
  @ApiOperation({ summary: "Filialni o'chirish" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "Filial o'chirildi" })
  remove(@Param("id") id: string) {
    return this.schoolsService.remove(+id);
  }
}
