import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { FacebookAuthGuard } from "./guards/facebook-auth.guard";
import { UsersService } from "../users/users.service";

@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return {
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req,
    @Body() body?: { refreshToken?: string },
  ) {
    await this.authService.logout(req.user._id.toString(), body?.refreshToken);
    return {
      message: "Logout successful",
    };
  }

  @UseGuards(JwtRefreshGuard)
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Request() req,
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    const userId = req.user._id.toString();
    return this.authService.refreshTokens(
      userId,
      refreshTokenDto.refreshToken,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMe(@Request() req) {
    return {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("users")
  async getUsers(@Request() req) {
    return this.usersService.findAll(req.user._id.toString());
  }

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Request() req) {
    return this.handleOAuthLogin(req.user);
  }

  @Get("facebook")
  @UseGuards(FacebookAuthGuard)
  async facebookAuth() {}

  @Get("facebook/callback")
  @UseGuards(FacebookAuthGuard)
  async facebookAuthRedirect(@Request() req) {
    return this.handleOAuthLogin(req.user);
  }

  @Get("verify/:token")
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Param("token") token: string) {
    const result = await this.authService.verifyEmail(token);
    return { message: result };
  }

  private async handleOAuthLogin(user: any) {
    const tokens = await this.authService.generateTokens(
      user._id.toString(),
      user.email,
    );
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user };
  }
}
