-- CreateEnum
CREATE TYPE "FocusArea" AS ENUM ('EDUCATION', 'CAREER', 'FINANCE', 'HEALTH_SPORTS', 'RELATIONSHIPS');

-- CreateEnum
CREATE TYPE "MotivationCard" AS ENUM ('FAMILY_LOVED_ONES', 'FREEDOM_INDEPENDENCE', 'PROVE_YOURSELF', 'COMFORT_LUXURY', 'CURIOSITY_GROWTH', 'INNER_PEACE_BALANCE');

-- CreateEnum
CREATE TYPE "ZodiacSign" AS ENUM ('ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "focusArea" "FocusArea",
ADD COLUMN     "focusDetail" TEXT,
ADD COLUMN     "hometown" TEXT,
ADD COLUMN     "motivationCard" "MotivationCard",
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "zodiacSign" "ZodiacSign";
