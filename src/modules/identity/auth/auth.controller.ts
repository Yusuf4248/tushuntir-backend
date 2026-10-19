import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthUser } from "../../../common/auth/auth-user";
import { ErrorResponseDto } from "../../../common/dto/paginated.dto";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { ALL_ROLES } from "../../../common/enums";
import { User } from "../users/entities/user.entity";
import { AuthService } from "./auth.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { TokenResponseDto } from "./dto/token-response.dto";

@ApiTags("Identity · Auth")
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@Roles(...ALL_ROLES)
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Log in with phone or email and password" })
  @ApiOkResponse({ type: TokenResponseDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get a new token pair",
    description:
      "The refresh token is single-use: the response contains a new one.",
  })
  @ApiOkResponse({ type: TokenResponseDto })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post("logout")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Log out; the current refresh token stops working" })
  @ApiNoContentResponse({ description: "Logged out" })
  logout(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user);
  }

  @Get("me")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "My profile" })
  @ApiOkResponse({ type: User })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user);
  }

  @Patch("me/password")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Change my password",
    description:
      "Requires the current password. Other sessions must log in again.",
  })
  @ApiNoContentResponse({ description: "Password changed" })
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user, dto);
  }
}
