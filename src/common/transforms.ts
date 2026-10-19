import { Transform } from "class-transformer";
import { ValueTransformer } from "typeorm";

/** Query strings arrive as text; turns "true"/"false" into booleans before validation. */
export const ToBoolean = () =>
  Transform(({ value }) =>
    value === "true" ? true : value === "false" ? false : value,
  );

/** pg returns numeric and bigint columns as strings; expose them as numbers. */
export const numberTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : Number(value),
};

/** YYYY-MM-DD for `date` columns. */
export const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** HH:mm or HH:mm:ss for `time` columns. */
export const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
