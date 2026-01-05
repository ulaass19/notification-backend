import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateAudienceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  rules: any[];
}
