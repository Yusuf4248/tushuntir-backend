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
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiProduces,
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
import { MAX_UPLOAD_BYTES } from "../../../shared/file/file.service";
import { MediaFileQueryDto } from "./dto/media-file-query.dto";
import { UpdateMediaFileDto } from "./dto/update-media-file.dto";
import { MediaFile } from "./entities/media-file.entity";
import { MediaFilesService } from "./media-files.service";

/** Multipart body with one field named "file". */
export const ApiFileBody = () =>
  ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: { file: { type: "string", format: "binary" } },
    },
  });

/** Content-Disposition that keeps non-ASCII filenames (RFC 5987). */
const attachmentDisposition = (name: string) =>
  `attachment; filename="${name.replace(/[^\x20-\x7e]|["\\]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`;

@ApiTags("Homework · Media files")
@ApiBearerAuth("JWT-auth")
@ApiErrorResponses()
@Roles(...ADMIN_PANEL_ROLES)
@Controller("media-files")
export class MediaFilesController {
  constructor(private readonly mediaFilesService: MediaFilesService) {}

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiFileBody()
  @ApiOperation({
    summary: "Upload a file",
    description:
      "Max 20 MB. Allowed: jpg, png, webp, gif, pdf, docx, pptx, xlsx, mp4 (no SVG). " +
      "The file is served at the returned relative url with its real Content-Type.",
  })
  @ApiCreatedResponse({ type: MediaFile })
  @ApiPayloadTooLargeResponse({ description: "File is larger than 20 MB" })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.mediaFilesService.upload(file, user);
  }

  @Get()
  @ApiOperation({ summary: "List media files" })
  @ApiPaginatedResponse(MediaFile)
  findAll(@Query() query: MediaFileQueryDto, @CurrentUser() user: AuthUser) {
    return this.mediaFilesService.findAll(query, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a media file" })
  @ApiOkResponse({ type: MediaFile })
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.mediaFilesService.findOne(id, user);
  }

  @Get(":id/download")
  @ApiOperation({
    summary: "Download a media file under its original filename",
  })
  @ApiProduces("application/octet-stream")
  @ApiOkResponse({
    description: "The file",
    schema: { type: "string", format: "binary" },
  })
  async download(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    const file = await this.mediaFilesService.download(id, user);
    return new StreamableFile(file.stream as never, {
      type: file.mimeType,
      length: file.sizeBytes,
      disposition: attachmentDisposition(file.originalName),
    });
  }

  @Patch(":id")
  @ApiOperation({ summary: "Rename a media file (download filename)" })
  @ApiOkResponse({ type: MediaFile })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateMediaFileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.mediaFilesService.update(id, dto, user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a media file, its attachments and the stored file",
  })
  @ApiNoContentResponse({ description: "Deleted" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.mediaFilesService.remove(id, user);
  }
}
