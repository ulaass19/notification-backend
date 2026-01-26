import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsIn,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// Prisma'dan role enum'u kullanıyorsan bunu kaldırıp prisma enumunu kullanabilirsin.
// Ama sen zaten AuthService'te @prisma/client UserRole kullanıyorsun.
// Burada DTO için basit enum da olur.
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  // ✅ NEW: profil alanları (mobile register akışından geliyor)
  @IsOptional()
  @IsIn(['FEMALE', 'MALE', 'PREFER_NOT_TO_SAY'])
  gender?: 'FEMALE' | 'MALE' | 'PREFER_NOT_TO_SAY';

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  hometown?: string;

  @IsOptional()
  @IsString()
  zodiacSign?: string;

  // bazı yerlerde birthYear gönderiliyor — kabul edelim
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  birthYear?: number;

  // mobile şu formatı gönderiyor: YYYY-MM-DD
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
