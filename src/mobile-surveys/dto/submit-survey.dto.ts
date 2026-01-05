import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitSurveyAnswerDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  questionId: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  optionId: number;
}

export class SubmitSurveyDto {
  @ApiProperty({ type: [SubmitSurveyAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitSurveyAnswerDto)
  answers: SubmitSurveyAnswerDto[];
}
