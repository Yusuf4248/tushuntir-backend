import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
  StreamableFile,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import { AuthUser } from "../../common/auth/auth-user";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ALL_ROLES } from "../../common/enums";
import { ApiErrorResponses } from "../../common/swagger/api-responses.decorator";
import { FileLinksService } from "../../shared/file/file-links.service";
import { FilesService, PrivateFile } from "./files.service";

function send(res: Response, file: PrivateFile, cache: string): StreamableFile {
  res.set({
    "Content-Type": file.mimeType,
    "Content-Length": String(file.sizeBytes),
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": cache,
  });
  return new StreamableFile(file.stream as never);
}

/** Private files (homework submissions); public uploads stay under /uploads. */
@ApiTags("Files")
@ApiErrorResponses()
@Controller("files")
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly links: FileLinksService,
  ) {}

  @Get("signed/:id")
  @Public()
  @ApiOperation({
    summary: "A private file through a signed link (no login)",
    description:
      "The links in API responses (e.g. homework submission files) look like this and work directly in <img> or " +
      "<a>. They expire at the end of the next full hour; 403 after that: fetch the response again for a new link.",
  })
  @ApiQuery({ name: "expires", example: 1795000000 })
  @ApiQuery({ name: "sig", example: "Q2x1ZGUgd2FzIGhlcmU" })
  @ApiProduces("application/pdf", "image/png", "image/jpeg")
  @ApiOkResponse({ description: "The file" })
  @ApiForbiddenResponse({ description: "Invalid or expired link" })
  async signed(
    @Param("id", ParseIntPipe) id: number,
    @Query("expires") expires: string,
    @Query("sig") sig: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!this.links.verify(id, Number(expires), sig)) {
      throw new ForbiddenException("This file link is invalid or has expired");
    }
    const maxAge = Math.max(0, Number(expires) - Math.floor(Date.now() / 1000));
    return send(
      res,
      await this.files.forSignedLink(id),
      `private, max-age=${maxAge}`,
    );
  }

  @Get(":id")
  @ApiBearerAuth("JWT-auth")
  @Roles(...ALL_ROLES)
  @ApiOperation({
    summary: "A private file for the logged-in user",
    description:
      "Homework submission files: the student who submitted it, a teacher of that class, an admin of that " +
      "school or a super admin. 404 for anyone else.",
  })
  @ApiProduces("application/pdf", "image/png", "image/jpeg")
  @ApiOkResponse({ description: "The file" })
  async download(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    return send(res, await this.files.forUser(id, user), "private, no-store");
  }
}
