import { HttpStatus } from "@nestjs/common";
import { QueryFailedError } from "typeorm";

interface PgError {
  code?: string;
  detail?: string;
  table?: string;
  column?: string;
  constraint?: string;
}

export interface MappedDbError {
  status: HttpStatus;
  message: string;
}

export function pgErrorOf(error: unknown): PgError | null {
  return error instanceof QueryFailedError
    ? (error.driverError as PgError)
    : null;
}

/** Maps Postgres error codes to HTTP errors. Returns null for errors that stay 500. */
export function mapDbError(error: unknown): MappedDbError | null {
  const pg = pgErrorOf(error);
  if (!pg) return null;
  switch (pg.code) {
    case "23505": // unique_violation: "Key (phone)=(+998...) already exists."
      return {
        status: HttpStatus.CONFLICT,
        message: pg.detail
          ? pg.detail.replace(/^Key /, "A record with ").replace(/\.$/, "")
          : "A record with the same unique value already exists",
      };
    case "23503": // foreign_key_violation
      return pg.detail?.includes("is still referenced")
        ? {
            status: HttpStatus.CONFLICT,
            message: `The record is still referenced from "${pg.table}"`,
          }
        : {
            status: HttpStatus.BAD_REQUEST,
            message: `A referenced record does not exist (${pg.detail ?? pg.constraint})`,
          };
    case "23502": // not_null_violation
      return {
        status: HttpStatus.BAD_REQUEST,
        message: `"${pg.column}" is required`,
      };
    case "23514": // check_violation
      return {
        status: HttpStatus.BAD_REQUEST,
        message: `A value is out of the allowed range (${pg.constraint})`,
      };
    case "22P02": // invalid_text_representation
    case "22007": // invalid_datetime_format
    case "22008": // datetime_field_overflow
    case "22003": // numeric_value_out_of_range
      return { status: HttpStatus.BAD_REQUEST, message: "Invalid value" };
    default:
      return null;
  }
}
