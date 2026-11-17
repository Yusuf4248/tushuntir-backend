import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  PayloadTooLargeException,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { Observable } from "rxjs";
import {
  MAX_SUBMISSION_FILE_BYTES,
  MAX_SUBMISSION_FILES,
} from "./student-homework.service";

/** Multipart field `files`: at most 3 files of 10 MB, with clear errors. */
@Injectable()
export class SubmissionUploadInterceptor extends FilesInterceptor(
  "files",
  MAX_SUBMISSION_FILES,
  { limits: { fileSize: MAX_SUBMISSION_FILE_BYTES } },
) {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    try {
      return await super.intercept(context, next);
    } catch (error) {
      if (error instanceof PayloadTooLargeException) {
        throw new PayloadTooLargeException("Each file must be at most 10 MB");
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(
          `At most ${MAX_SUBMISSION_FILES} files, sent in the field "files"`,
        );
      }
      throw error;
    }
  }
}
