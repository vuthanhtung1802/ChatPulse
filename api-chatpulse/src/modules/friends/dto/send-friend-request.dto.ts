import { IsMongoId, IsNotEmpty } from "class-validator";

export class SendFriendRequestDto {
  @IsNotEmpty()
  @IsMongoId()
  to: string;
} 
