-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" SERIAL NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "attempt" INTEGER NOT NULL,
    "statusBefore" "NotificationStatus",
    "statusAfter" "NotificationStatus",
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "provider" TEXT,
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
