import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { OneSignalService } from './onesignal.service';
import { NotificationScheduler } from './notification.scheduler';
import { NotificationStreamService } from '../notification/realtime/notification-stream.service';

@Module({
  imports: [],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    PrismaService,
    OneSignalService,
    NotificationScheduler,
    NotificationStreamService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
