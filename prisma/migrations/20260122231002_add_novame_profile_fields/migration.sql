-- CreateEnum
CREATE TYPE "EnergyDipTime" AS ENUM ('AFTERNOON_14_16', 'EVENING_18', 'MORNING_07', 'NIGHT_23');

-- CreateEnum
CREATE TYPE "ComfortZone" AS ENUM ('COFFEE_SMELL', 'PLAY_WITH_PET', 'LISTEN_MUSIC', 'CHOCOLATE', 'WALK');

-- CreateEnum
CREATE TYPE "NegativeSelfTalk" AS ENUM ('INADEQUATE', 'TOO_LATE', 'MUST_BE_PERFECT', 'WHAT_WILL_THEY_SAY');

-- CreateEnum
CREATE TYPE "WorkContext" AS ENUM ('OFFICE_PLAZA', 'HOME_OFFICE', 'CAFE_OUTSIDE', 'SCHOOL_LIBRARY');

-- CreateEnum
CREATE TYPE "ToneOfVoice" AS ENUM ('SERGEANT', 'ZEN', 'LOGIC');

-- CreateEnum
CREATE TYPE "BigDayType" AS ENUM ('EXAM', 'PRESENTATION', 'WEDDING', 'PROJECT_DEADLINE', 'VACATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ChildrenAgeRange" AS ENUM ('BABY_0_2', 'CHILD_3_12', 'TEEN_13_17', 'ADULT_18_PLUS', 'MIXED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bigDayDate" TIMESTAMP(3),
ADD COLUMN     "bigDayLabel" TEXT,
ADD COLUMN     "bigDayType" "BigDayType",
ADD COLUMN     "childrenAgeRange" "ChildrenAgeRange",
ADD COLUMN     "comfortZones" "ComfortZone"[],
ADD COLUMN     "energyDipTime" "EnergyDipTime",
ADD COLUMN     "hasChildren" BOOLEAN,
ADD COLUMN     "negativeSelfTalk" "NegativeSelfTalk",
ADD COLUMN     "petName" TEXT,
ADD COLUMN     "toneOfVoice" "ToneOfVoice",
ADD COLUMN     "workContext" "WorkContext";
