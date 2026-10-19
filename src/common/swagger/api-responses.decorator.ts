import { applyDecorators, Type } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { ErrorResponseDto, PaginatedMetaDto } from "../dto/paginated.dto";

/** `{ data: Model[], meta }` response for list endpoints. */
export const ApiPaginatedResponse = <T extends Type<unknown>>(model: T) =>
  applyDecorators(
    ApiExtraModels(PaginatedMetaDto, model),
    ApiOkResponse({
      schema: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: getSchemaPath(model) } },
          meta: { $ref: getSchemaPath(PaginatedMetaDto) },
        },
      },
    }),
  );

/** The error responses every protected CRUD route can return. */
export const ApiErrorResponses = () =>
  applyDecorators(
    ApiBadRequestResponse({
      type: ErrorResponseDto,
      description: "Validation failed or a referenced record is invalid",
    }),
    ApiUnauthorizedResponse({
      type: ErrorResponseDto,
      description: "Missing or invalid access token",
    }),
    ApiForbiddenResponse({
      type: ErrorResponseDto,
      description: "Role not allowed",
    }),
    ApiNotFoundResponse({
      type: ErrorResponseDto,
      description: "Record or referenced record not found",
    }),
    ApiConflictResponse({
      type: ErrorResponseDto,
      description: "Duplicate value, or the record is still referenced",
    }),
  );
