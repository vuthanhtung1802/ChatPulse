import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UserDocument } from "../users/schemas/user.schema";
import { StringValue } from "ms";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<UserDocument> {
    const { name, email, password } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      name,
      email,
      password: hashedPassword,
    });

    return user;
  }

  async generateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { email, sub: userId };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_SECRET") as StringValue,
      expiresIn: this.configService.get<string>(
        "JWT_EXPIRES_IN",
      ) as StringValue,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        "JWT_REFRESH_SECRET",
      ) as StringValue,
      expiresIn: this.configService.get<string>(
        "JWT_REFRESH_EXPIRES_IN",
      ) as StringValue,
    });

    return { accessToken, refreshToken };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.generateTokens(user._id.toString(), user.email);

    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersService.setRefreshToken(
      user._id.toString(),
      hashedRefreshToken,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async logout(userId: string, _refreshToken?: string): Promise<void> {
    void _refreshToken;
    await this.usersService.removeAllRefreshTokens(userId);
    await this.usersService.updateStatus(userId, "offline");
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshTokens || user.refreshTokens.length === 0) {
      throw new UnauthorizedException("Access Denied");
    }

    const isMatched = await bcrypt.compare(refreshToken, user.refreshTokens[0]);
    if (!isMatched) {
      throw new UnauthorizedException("Access Denied");
    }

    const tokens = await this.generateTokens(user._id.toString(), user.email);
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);

    await this.usersService.updateRefreshToken(
      user._id.toString(),
      hashedRefreshToken,
    );

    return tokens;
  }
}
