import { UserRole } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /** Üstteki global search: ID / ad / email */
  @IsOptional()
  @IsString()
  search?: string;

  /** Kolondaki "Ad Soyad" filtresi */
  @IsOptional()
  @IsString()
  fullName?: string;

  /** Kolondaki "E-posta" filtresi */
  @IsOptional()
  @IsString()
  email?: string;

  /** Rol filtresi: ADMIN | USER */
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  /** Durum filtresi: aktif / pasif */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  /** Kayıt tarihi (başlangıç/bitiş) */
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;
}
