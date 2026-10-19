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
import { CreateTermDto } from "./dto/create-term.dto";
import { TermQueryDto } from "./dto/term-query.dto";
import { UpdateTermDto } from "./dto/update-term.dto";
import { Term } from "./entities/term.entity";
import { TermsService } from "./terms.service";

@ApiTags("School · Terms")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("terms")
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Post()
  @ApiOperation({ summary: "Create a term" })
  @ApiCreatedResponse({ type: Term })
  create(@Body() dto: CreateTermDto, @CurrentUser() user: AuthUser) {
    return this.termsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List terms" })
  @ApiPaginatedResponse(Term)
  findAll(@Query() query: TermQueryDto, @CurrentUser() user: AuthUser) {
    return this.termsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a term" })
  @ApiOkResponse({ type: Term })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.termsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a term" })
  @ApiOkResponse({ type: Term })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateTermDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.termsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a term" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.termsService.remove(id, user);
  }
}
