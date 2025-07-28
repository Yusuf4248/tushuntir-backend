import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class JwtSelfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (user.role == "admin" || user.role == "superadmin") {
      return true;
    }
    const id = +req.params.id;
    if (+user.id !== +id) {
      throw new ForbiddenException("Ruxsat etilmagan foydalanuvchi!");
    }
    return true;
  }
}
