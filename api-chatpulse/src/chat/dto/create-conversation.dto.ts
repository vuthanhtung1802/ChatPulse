import {
  IsArray,
  ArrayMinSize,
  IsString,
  IsBoolean,
  IsOptional,
} from "class-validator";

export class CreateConversationDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participantIds: string[];

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @IsOptional()
  @IsString()
  groupName?: string;
}
