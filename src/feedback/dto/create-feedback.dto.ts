// src/feedback/dto/create-feedback.dto.ts
import { IsInt, Max, Min, IsOptional, IsString } from 'class-validator';

export class CreateFeedbackDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number; // 1–5

  @IsOptional()
  @IsString()
  note?: string; // opsiyonel kısa yorum
}
