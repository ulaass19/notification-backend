// src/user/dto/update-user-by-admin.dto.ts
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Gender, MaritalStatus, UserRole } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserByAdminDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  birthYear?: number;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ enum: MaritalStatus })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;
}
