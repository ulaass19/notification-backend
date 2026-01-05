// src/notification/dto/update-notification.dto.ts
import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  /**
   * Edit sayfasında datetime-local ile gelen tarih için:
   *  - scheduledAt veya sendAt gönderilebilir
   */
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  sendAt?: string;

  /**
   * Bildirime bağlı audience değiştirme / set etme
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  audienceId?: number;
}
