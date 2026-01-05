import {
  BiggestStruggle,
  ContentTypePreference,
  Gender,
  GoalTimeframe,
  InterestCategory,
  MaritalStatus,
  MotivationType,
  PrimaryGoal,
  StressLevel,
} from '@prisma/client';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ArrayNotEmpty,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsNumber()
  birthYear?: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  educationLevel?: string;

  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @IsOptional()
  @IsArray()
  @IsEnum(InterestCategory, { each: true })
  interests?: InterestCategory[];

  @IsOptional()
  @IsEnum(PrimaryGoal)
  primaryGoal?: PrimaryGoal;

  @IsOptional()
  @IsEnum(GoalTimeframe)
  goalTimeframe?: GoalTimeframe;

  @IsOptional()
  @IsString()
  dailyAppTime?: string;

  @IsOptional()
  @IsString()
  activeTimeOfDay?: string;

  @IsOptional()
  @IsString()
  socialMediaUsage?: string;

  @IsOptional()
  @IsEnum(StressLevel)
  stressLevel?: StressLevel;

  @IsOptional()
  @IsArray()
  @IsEnum(ContentTypePreference, { each: true })
  preferredContent?: ContentTypePreference[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selfDescriptionWords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  personalityTraits?: string[];

  @IsOptional()
  @IsEnum(MotivationType)
  mainMotivation?: MotivationType;

  @IsOptional()
  @IsEnum(BiggestStruggle)
  biggestStruggle?: BiggestStruggle;

  // 🔥 EKLENEN ALAN (PUSH İÇİN KRİTİK)
  @IsOptional()
  @IsString()
  deviceId?: string;

}
