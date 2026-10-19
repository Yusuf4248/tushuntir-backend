import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthUser } from "../auth/auth-user";

/** The authenticated user set by JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest().user,
);
