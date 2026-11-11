import { Injectable } from "@nestjs/common";
import {
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerLimitDetail,
} from "@nestjs/throttler";
import { AuthUser } from "../auth/auth-user";

/**
 * Counts requests per logged-in user (per IP before login) and per route, and answers 429 in
 * Uzbek. Counters live in memory: they reset on restart and are not shared between instances.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const user = req.user as AuthUser | undefined;
    return user ? `user:${user.id}` : `ip:${req.ip}`;
  }

  protected async throwThrottlingException(
    _context: unknown,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const seconds = Math.max(1, Math.ceil(detail.timeToBlockExpire));
    const wait =
      seconds >= 120
        ? `${Math.ceil(seconds / 60)} daqiqadan`
        : `${seconds} soniyadan`;
    throw new ThrottlerException(
      `Juda ko'p so'rov yubordingiz. Iltimos, ${wait} keyin qayta urinib ko'ring.`,
    );
  }
}
