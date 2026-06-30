import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(["online", "offline"])
  status: string;
}
