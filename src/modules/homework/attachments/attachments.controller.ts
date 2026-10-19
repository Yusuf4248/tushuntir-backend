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
import { CreateAttachmentDto } from "./dto/create-attachment.dto";
import { AttachmentQueryDto } from "./dto/attachment-query.dto";
import { UpdateAttachmentDto } from "./dto/update-attachment.dto";
import { Attachment } from "./entities/attachment.entity";
import { AttachmentsService } from "./attachments.service";

@ApiTags("Homework · Attachments")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("attachments")
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @ApiOperation({ summary: "Create an attachment" })
  @ApiCreatedResponse({ type: Attachment })
  create(@Body() dto: CreateAttachmentDto, @CurrentUser() user: AuthUser) {
    return this.attachmentsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List attachments" })
  @ApiPaginatedResponse(Attachment)
  findAll(@Query() query: AttachmentQueryDto, @CurrentUser() user: AuthUser) {
    return this.attachmentsService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an attachment" })
  @ApiOkResponse({ type: Attachment })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attachmentsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an attachment" })
  @ApiOkResponse({ type: Attachment })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateAttachmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attachmentsService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an attachment" })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.attachmentsService.remove(id, user);
  }
}
