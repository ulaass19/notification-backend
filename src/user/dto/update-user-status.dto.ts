// src/user/dto/update-user-status.dto.ts
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @IsBoolean()
  isActive: boolean;
}
