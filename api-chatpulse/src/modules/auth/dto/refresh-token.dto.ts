import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString({ message: "Refresh token must be a string" })
  refreshToken: string;
}
