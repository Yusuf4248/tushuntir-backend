import {
  CallHandler,
  ExecutionContext,
  Injectable,
  PayloadTooLargeException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Observable } from "rxjs";
import {
  AUDIO_TOO_LARGE_MESSAGE,
  MAX_AUDIO_BYTES,
} from "../ai/speech/audio-format";

/** Multipart field `audio`, at most 5 MB; the over-limit error is in Uzbek. */
@Injectable()
export class AudioUploadInterceptor extends FileInterceptor("audio", {
  limits: { fileSize: MAX_AUDIO_BYTES },
}) {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    try {
      return await super.intercept(context, next);
    } catch (error) {
      if (error instanceof PayloadTooLargeException) {
        throw new PayloadTooLargeException(AUDIO_TOO_LARGE_MESSAGE);
      }
      throw error;
    }
  }
}
