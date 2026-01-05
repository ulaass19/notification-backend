// src/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { OneSignalService } from './onesignal.service';
import { NotificationScheduler } from './notification.scheduler';

@Module({
  imports: [],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    PrismaService,
    OneSignalService, // 🔴 ESKİK OLAN BUYDU
    NotificationScheduler, // cron için eklediğimiz
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
