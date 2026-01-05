import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateSurveyOptionDto {
  @ApiProperty()
  @IsString()
  text: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

class CreateSurveyQuestionDto {
  @ApiProperty()
  @IsString()
  text: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ type: [CreateSurveyOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyOptionDto)
  options: CreateSurveyOptionDto[];
}

export class CreateSurveyDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'ISO date',
    example: '2025-12-30T18:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ description: 'ISO date' })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({ description: 'Target audience ids', type: [Number] })
  @IsOptional()
  @IsArray()
  audienceIds?: number[];

  @ApiProperty({ type: [CreateSurveyQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDto)
  questions: CreateSurveyQuestionDto[];
}
