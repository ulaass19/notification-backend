import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
// UserRole enum'unu ya buraya kendin yaz, ya da Prisma'dan al
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
  role?: UserRole; // 🔥 BURAYI EKLİYORUZ
}
