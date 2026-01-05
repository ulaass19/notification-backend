import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateSurveyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  audienceIds?: number[];
}
