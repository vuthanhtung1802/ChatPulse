import { IsNotEmpty } from "class-validator";

export class RefreshTokenDto {
  @IsNotEmpty({ message: "Refresh token should not be empty" })
  refreshToken: string;
}
