import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Gender, ZodiacSign, UserRole } from '@prisma/client';

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

  // ✅ Profile alanları (register akışında yolladıkların)
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  hometown?: string;

  @IsOptional()
  @IsEnum(ZodiacSign)
  zodiacSign?: ZodiacSign;

  // Eğer sadece yıl yolluyorsan
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  birthYear?: number;

  // Eğer "YYYY-MM-DD" yolluyorsan (senin flow’da var)
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
