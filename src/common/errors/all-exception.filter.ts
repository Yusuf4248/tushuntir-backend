import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { mapDbError } from "./db-error";

/**
 * One error shape for every response: { statusCode, message, error?, path, timestamp }.
 * Postgres errors are mapped to 400/409; anything unexpected becomes a generic 500
 * and is logged, never sent to the client.
 */
@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Internal server error";
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
      } else {
        const { message: bodyMessage, error: bodyError } = body as {
          message?: string | string[];
          error?: string;
        };
        message = bodyMessage ?? exception.message;
        error = bodyError;
      }
    } else {
      const mapped = mapDbError(exception);
      if (mapped) {
        status = mapped.status;
        message = mapped.message;
      }
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url}: ${exception instanceof Error ? exception.stack : String(exception)}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(error ? { error } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
