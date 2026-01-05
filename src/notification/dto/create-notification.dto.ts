// src/notification/dto/create-notification.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  /**
   * Frontend create ekranı için kullandığımız isim:
   *  - type="datetime-local" → string geliyor
   */
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  /**
   * Eski isimle gelen istekler için geriye dönük uyumluluk.
   * Eğer body içinde sendAt varsa, hata vermesin.
   */
  @IsOptional()
  @IsDateString()
  sendAt?: string;

  /**
   * Seçilen kitle (Dropdown’dan gelen)
   * Validation pipe whitelist açık olduğu için burada tanımlı olması şart.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  audienceId?: number;
}
