import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class PublishSurveyDto {
  @ApiPropertyOptional({ description: 'publish window start' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ description: 'publish window end' })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}
