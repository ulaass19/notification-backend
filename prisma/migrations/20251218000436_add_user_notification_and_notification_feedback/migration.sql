-- CreateTable
CREATE TABLE "UserNotification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shownAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationFeedback" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "userNotificationId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserNotification_userId_deliveredAt_idx" ON "UserNotification"("userId", "deliveredAt");

-- CreateIndex
CREATE INDEX "UserNotification_notificationId_idx" ON "UserNotification"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotification_userId_notificationId_key" ON "UserNotification"("userId", "notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationFeedback_userNotificationId_key" ON "NotificationFeedback"("userNotificationId");

-- CreateIndex
CREATE INDEX "NotificationFeedback_userId_createdAt_idx" ON "NotificationFeedback"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationFeedback" ADD CONSTRAINT "NotificationFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationFeedback" ADD CONSTRAINT "NotificationFeedback_userNotificationId_fkey" FOREIGN KEY ("userNotificationId") REFERENCES "UserNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
