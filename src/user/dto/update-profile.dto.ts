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

  // ✅ NovaMe / DailySpark enums (schema.prisma'da ekledik)
  EnergyDipTime,
  ComfortZone,
  NegativeSelfTalk,
  WorkContext,
  ToneOfVoice,
  BigDayType,
  ChildrenAgeRange,
} from '@prisma/client';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  IsDateString,
  MaxLength,
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

  /* ===================== NovaMe / DailySpark Profil Soruları ===================== */

  // 1) Enerji çöküş saati (tek seçim)
  @IsOptional()
  @IsEnum(EnergyDipTime)
  energyDipTime?: EnergyDipTime;

  // 2) Comfort zones (çoklu seçim)
  @IsOptional()
  @IsArray()
  @IsEnum(ComfortZone, { each: true })
  comfortZones?: ComfortZone[];

  // comfortZones içinde PLAY_WITH_PET seçildiyse anlamlı
  @IsOptional()
  @IsString()
  @MaxLength(50)
  petName?: string;

  // 3) Negatif iç ses (tek seçim)
  @IsOptional()
  @IsEnum(NegativeSelfTalk)
  negativeSelfTalk?: NegativeSelfTalk;

  // 4) Çalışma/vakit ortamı (tek seçim)
  @IsOptional()
  @IsEnum(WorkContext)
  workContext?: WorkContext;

  // 5) Ton seçimi (tek seçim)
  @IsOptional()
  @IsEnum(ToneOfVoice)
  toneOfVoice?: ToneOfVoice;

  // 6) Yaklaşan büyük gün
  @IsOptional()
  @IsDateString()
  bigDayDate?: string;

  @IsOptional()
  @IsEnum(BigDayType)
  bigDayType?: BigDayType;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  bigDayLabel?: string;

  // 7) Ebeveynlik durumu
  @IsOptional()
  @IsBoolean()
  hasChildren?: boolean;

  @IsOptional()
  @IsEnum(ChildrenAgeRange)
  childrenAgeRange?: ChildrenAgeRange;

  /* ============================================================================ */
}
