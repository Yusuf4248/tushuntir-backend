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
import { CreateSupportGroupDto } from "./dto/create-support-group.dto";
import { SupportGroupQueryDto } from "./dto/support-group-query.dto";
import { UpdateSupportGroupDto } from "./dto/update-support-group.dto";
import { SupportGroup } from "./entities/support-group.entity";
import { SupportGroupsService } from "./support-groups.service";

@ApiTags("Support · Support groups")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("support-groups")
export class SupportGroupsController {
  constructor(private readonly supportGroupsService: SupportGroupsService) {}

  @Post()
  @ApiOperation({ summary: "Create a support group" })
  @ApiCreatedResponse({ type: SupportGroup })
  create(@Body() dto: CreateSupportGroupDto, @CurrentUser() user: AuthUser) {
    return this.supportGroupsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List support groups" })
  @ApiPaginatedResponse(SupportGroup)
  findAll(@Query() query: SupportGroupQueryDto, @CurrentUser() user: AuthUser) {
    return this.supportGroupsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a support group" })
  @ApiOkResponse({ type: SupportGroup })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.supportGroupsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a support group" })
  @ApiOkResponse({ type: SupportGroup })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateSupportGroupDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.supportGroupsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a support group" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.supportGroupsService.remove(id, user);
  }
}
