import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { createHash, randomUUID, timingSafeEqual } from "crypto";
import { Repository } from "typeorm";
import { AuthUser } from "../../../common/auth/auth-user";
import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";
import { TokenResponseDto } from "./dto/token-response.dto";

interface RefreshTokenPayload {
  sub: number;
  type: "refresh";
  jti: string;
}

/**
 * Refresh tokens are stored as a SHA-256 hash: bcrypt only reads the first 72 bytes,
 * and two JWTs of the same user share far more than that, so an old token would match.
 */
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const sameHash = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Compared against when the login is unknown, so both cases take the same time. */
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login({ login, password }: LoginDto): Promise<TokenResponseDto> {
    const user = await this.users
      .createQueryBuilder("account")
      .addSelect("account.passwordHash")
      .where("account.phone = :login", { login })
      .orWhere("account.email = :email", { email: login.toLowerCase() })
      .getOne();
    const valid = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !valid) {
      throw new UnauthorizedException("Wrong login or password");
    }
    if (user.isActive !== true) {
      throw new UnauthorizedException("This account is deactivated");
    }
    await this.users.update(user.id, { lastLoginAt: new Date() });
    return this.issueTokens(user.id);
  }

  /** Rotates the pair; the old refresh token stops working. */
  async refresh(refreshToken: string): Promise<TokenResponseDto> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
    const user =
      payload.type === "refresh"
        ? await this.users
            .createQueryBuilder("account")
            .addSelect("account.refreshTokenHash")
            .where("account.id = :id", { id: payload.sub })
            .getOne()
        : null;
    if (
      !user?.refreshTokenHash ||
      !sameHash(user.refreshTokenHash, hashToken(refreshToken))
    ) {
      throw new UnauthorizedException(
        "Refresh token was revoked; log in again",
      );
    }
    if (user.isActive !== true) {
      throw new UnauthorizedException("This account is deactivated");
    }
    return this.issueTokens(user.id);
  }

  async logout(user: AuthUser): Promise<void> {
    await this.users.update(user.id, { refreshTokenHash: null });
  }

  me(user: AuthUser): Promise<User> {
    return this.users.findOneOrFail({
      where: { id: user.id },
      relations: { school: true },
    });
  }

  /** Own password change; also ends the refresh session on other devices. */
  async changePassword(user: AuthUser, dto: ChangePasswordDto): Promise<void> {
    const account = await this.users
      .createQueryBuilder("account")
      .addSelect("account.passwordHash")
      .where("account.id = :id", { id: user.id })
      .getOneOrFail();
    if (!(await bcrypt.compare(dto.currentPassword, account.passwordHash))) {
      throw new UnauthorizedException("Current password is wrong");
    }
    await this.users.update(user.id, {
      passwordHash: await this.usersService.hashPassword(dto.newPassword),
      refreshTokenHash: null,
    });
  }

  private async issueTokens(userId: number): Promise<TokenResponseDto> {
    const accessTtl = this.config.getOrThrow<string>("JWT_ACCESS_TTL");
    const refreshTtl = this.config.getOrThrow<string>("JWT_REFRESH_TTL");
    const accessToken = await this.jwt.signAsync(
      { sub: userId, type: "access" },
      {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: accessTtl as JwtSignOptions["expiresIn"],
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, type: "refresh", jti: randomUUID() },
      {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: refreshTtl as JwtSignOptions["expiresIn"],
      },
    );
    await this.users.update(userId, {
      refreshTokenHash: hashToken(refreshToken),
    });
    const user = await this.users.findOneOrFail({
      where: { id: userId },
      relations: { school: true },
    });
    return {
      tokenType: "Bearer",
      accessToken,
      refreshToken,
      expiresIn: accessTtl,
      user,
    };
  }
}
