import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  ArrayMinSize,
} from 'class-validator';

export class SendToUsersDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  // Opsiyonel: hemen gönder (boşsa şimdi)
  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  userIds?: number[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  emails?: string[];
}
