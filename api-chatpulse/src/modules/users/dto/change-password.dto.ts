import { IsNotEmpty, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsNotEmpty({ message: "Old password should not be empty" })
  oldPassword: string;

  @IsNotEmpty({ message: "New password should not be empty" })
  @MinLength(6, { message: "New password must be at least 6 characters" })
  newPassword: string;
}
