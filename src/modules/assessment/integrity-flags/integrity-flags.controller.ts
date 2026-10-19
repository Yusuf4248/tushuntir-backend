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
import { CreateIntegrityFlagDto } from "./dto/create-integrity-flag.dto";
import { IntegrityFlagQueryDto } from "./dto/integrity-flag-query.dto";
import { UpdateIntegrityFlagDto } from "./dto/update-integrity-flag.dto";
import { IntegrityFlag } from "./entities/integrity-flag.entity";
import { IntegrityFlagsService } from "./integrity-flags.service";

@ApiTags("Assessment · Integrity flags")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("integrity-flags")
export class IntegrityFlagsController {
  constructor(private readonly integrityFlagsService: IntegrityFlagsService) {}

  @Post()
  @ApiOperation({ summary: "Create an integrity flag" })
  @ApiCreatedResponse({ type: IntegrityFlag })
  create(@Body() dto: CreateIntegrityFlagDto, @CurrentUser() user: AuthUser) {
    return this.integrityFlagsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List integrity flags" })
  @ApiPaginatedResponse(IntegrityFlag)
  findAll(
    @Query() query: IntegrityFlagQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.integrityFlagsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an integrity flag" })
  @ApiOkResponse({ type: IntegrityFlag })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.integrityFlagsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an integrity flag" })
  @ApiOkResponse({ type: IntegrityFlag })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateIntegrityFlagDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.integrityFlagsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an integrity flag" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.integrityFlagsService.remove(id, user);
  }
}
