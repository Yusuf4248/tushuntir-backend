import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

@Injectable()
export class ProfileGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Token not found");
    }
    const token = authHeader.split(" ")[1];

    let payload: any;
    try {
      payload = this.jwtService.decode(token);
      if (
        !payload ||
        typeof payload !== "object" ||
        !payload.role ||
        !payload.id
      ) {
        throw new UnauthorizedException("Token payload invalid");
      }
      // Faqat ruxsat etilgan rollar
      const allowedRoles = ["admin", "teacher", "student"];
      if (!allowedRoles.includes(payload.role)) {
        throw new ForbiddenException("This role is not allowed for profile");
      }
      // Tokenni verify qilamiz
      const secret = this.getSecretByRole(payload.role);
      payload = await this.jwtService.verifyAsync(token, { secret });
      (req as any).user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException("Token is invalid or expired");
    }
  }

  private getSecretByRole(role: string): string {
    switch (role) {
      case "admin":
        return process.env.ADMIN_ACCESS_TOKEN_KEY!;
      case "teacher":
        return process.env.TEACHER_ACCESS_TOKEN_KEY!;
      case "student":
        return process.env.STUDENT_ACCESS_TOKEN_KEY!;
      default:
        throw new ForbiddenException("Role is not allowed");
    }
  }
}
