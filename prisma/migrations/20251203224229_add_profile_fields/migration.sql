-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'IN_RELATIONSHIP', 'MARRIED', 'SEPARATED_DIVORCED', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "InterestCategory" AS ENUM ('PERSONAL_DEVELOPMENT', 'RELATIONSHIPS_PSYCHOLOGY', 'BUSINESS_ENTREPRENEURSHIP', 'FITNESS_HEALTH', 'FOOD_LIFESTYLE', 'FINANCE_INVESTING', 'FASHION_STYLE', 'TECHNOLOGY', 'MINIMALISM', 'MOTIVATION_HABITS');

-- CreateEnum
CREATE TYPE "PrimaryGoal" AS ENUM ('SELF_IMPROVEMENT', 'MORE_MONEY', 'BETTER_RELATIONSHIP', 'BETTER_APPEARANCE', 'HEALTHIER', 'CAREER_ADVANCEMENT', 'QUIT_BAD_HABITS');

-- CreateEnum
CREATE TYPE "GoalTimeframe" AS ENUM ('ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'ONE_YEAR');

-- CreateEnum
CREATE TYPE "StressLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ContentTypePreference" AS ENUM ('VIDEO', 'ARTICLE', 'QUIZ', 'PODCAST', 'SHORT_NOTES');

-- CreateEnum
CREATE TYPE "MotivationType" AS ENUM ('MONEY', 'STATUS_APPROVAL', 'SECURITY_COMFORT', 'LOVE_ACCEPTANCE', 'FREEDOM', 'SUCCESS_POWER');

-- CreateEnum
CREATE TYPE "BiggestStruggle" AS ENUM ('FOCUS', 'RELATIONSHIPS', 'MONEY_MANAGEMENT', 'SELF_CONFIDENCE', 'HEALTH_DISCIPLINE', 'WORK_LIFE', 'MOTIVATION');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeTimeOfDay" TEXT,
ADD COLUMN     "biggestStruggle" "BiggestStruggle",
ADD COLUMN     "birthYear" INTEGER,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "dailyAppTime" TEXT,
ADD COLUMN     "educationLevel" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "goalTimeframe" "GoalTimeframe",
ADD COLUMN     "interests" "InterestCategory"[],
ADD COLUMN     "mainMotivation" "MotivationType",
ADD COLUMN     "maritalStatus" "MaritalStatus",
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "personalityTraits" TEXT[],
ADD COLUMN     "preferredContent" "ContentTypePreference"[],
ADD COLUMN     "primaryGoal" "PrimaryGoal",
ADD COLUMN     "selfDescriptionWords" TEXT[],
ADD COLUMN     "socialMediaUsage" TEXT,
ADD COLUMN     "stressLevel" "StressLevel";
