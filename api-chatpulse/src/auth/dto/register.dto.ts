import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class RegisterDto {
  @IsNotEmpty({ message: "Name should not be empty" })
  name: string;

  @IsEmail({}, { message: "Invalid email address" })
  email: string;

  @IsNotEmpty({ message: "Password should not be empty" })
  @MinLength(6, { message: "Password must be at least 6 characters" })
  password: string;
}
