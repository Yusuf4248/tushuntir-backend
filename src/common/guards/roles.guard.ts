import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthUser } from "../auth/auth-user";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { UserRole } from "../enums";

/** Global guard: the user's role must be listed in @Roles(). Routes without @Roles are refused. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }
    const roles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      targets,
    );
    if (!roles?.length) {
      throw new ForbiddenException("This route has no role configuration");
    }
    const user: AuthUser = context.switchToHttp().getRequest().user;
    if (!roles.includes(user.role)) {
      throw new ForbiddenException(`Role ${user.role} cannot use this route`);
    }
    return true;
  }
}
