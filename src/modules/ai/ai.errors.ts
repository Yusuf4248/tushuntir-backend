import { ServiceUnavailableException } from "@nestjs/common";

/** Every AI failure reaches the client as a 503 with a short reason; details go to the log. */
export class AiUnavailableException extends ServiceUnavailableException {
  constructor(reason: string) {
    super(`AI service is unavailable: ${reason}`);
  }
}
