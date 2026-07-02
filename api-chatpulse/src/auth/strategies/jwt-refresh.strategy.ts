import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import * as bcrypt from "bcrypt";
import { UsersService } from "../../users/users.service";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  "jwt-refresh",
) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refreshToken || request?.body?.refreshToken || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_REFRESH_SECRET"),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: any) {
    const refreshToken = request?.cookies?.refreshToken || request?.body?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is required");
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshTokens || user.refreshTokens.length === 0) {
      throw new UnauthorizedException();
    }

    // Verify if the refresh token matches one of the stored tokens in the array
    let matched = false;
    for (const tokenHash of user.refreshTokens) {
      const isMatched = await bcrypt.compare(refreshToken, tokenHash);
      if (isMatched) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return user;
  }
}
