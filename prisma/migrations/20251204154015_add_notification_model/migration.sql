/*
  Warnings:

  - You are about to drop the column `message` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `body` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "message",
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "sendAt" SET DEFAULT CURRENT_TIMESTAMP;
