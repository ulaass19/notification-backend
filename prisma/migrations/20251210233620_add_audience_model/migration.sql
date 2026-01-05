-- CreateTable
CREATE TABLE "Audience" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL,
    "userCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Audience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationAudience" (
    "id" SERIAL NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "audienceId" INTEGER NOT NULL,

    CONSTRAINT "NotificationAudience_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NotificationAudience" ADD CONSTRAINT "NotificationAudience_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAudience" ADD CONSTRAINT "NotificationAudience_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "Audience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
