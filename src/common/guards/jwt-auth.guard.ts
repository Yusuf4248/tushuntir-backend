import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { DataSource } from "typeorm";
import { User } from "../../modules/identity/users/entities/user.entity";
import { AuthUser } from "../auth/auth-user";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

export interface AccessTokenPayload {
  sub: number;
  type: "access";
}

/**
 * Global guard: every route needs a valid access token unless it is @Public().
 * The user is re-read on every request, so deactivation takes effect immediately.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const [scheme, token] = (request.headers.authorization ?? "").split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
    if (payload.type !== "access") {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: payload.sub },
      select: { id: true, role: true, schoolId: true, isActive: true },
    });
    if (!user || user.isActive !== true) {
      throw new UnauthorizedException("User is inactive or no longer exists");
    }
    request.user = {
      id: user.id,
      role: user.role,
      schoolId: user.schoolId,
    } satisfies AuthUser;
    return true;
  }
}
