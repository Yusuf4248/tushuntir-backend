import { applyDecorators, UseGuards } from "@nestjs/common";
import { ApiTooManyRequestsResponse } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { UserThrottlerGuard } from "./user-throttler.guard";

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

/** Per-user limit on one route (ThrottlerModule must be imported by the route's module). */
export function RateLimit(limit: number, ttl: number) {
  const window = ttl >= HOUR ? `${ttl / HOUR} h` : `${ttl / MINUTE} min`;
  return applyDecorators(
    UseGuards(UserThrottlerGuard),
    Throttle({ default: { limit, ttl } }),
    ApiTooManyRequestsResponse({
      description: `More than ${limit} requests per ${window} for this user. Retry-After gives the seconds to wait; the message is in Uzbek.`,
    }),
  );
}
