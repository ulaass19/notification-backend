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

// UserRole enum'unu ya buraya kendin yaz, ya da Prisma'dan al
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// ✅ Mobilin gönderdiği gender değerleriyle birebir
export enum Gender {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
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

  // ✅ ADIM ADIM TOPLADIĞIN ALANLAR (hepsi opsiyonel)
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
  @IsString()
  zodiacSign?: string;

  // Mobil "YYYY-MM-DD" gönderiyor -> date string kabul edelim
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  // Eğer ileride sadece yıl gönderirsen diye:
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  birthYear?: number;
}
