import { Module } from '@nestjs/common';
import { UserNotificationsController } from './user-notifications.controller';
import { UserNotificationsService } from './user-notifications.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserNotificationsController],
  providers: [UserNotificationsService],
})
export class UserNotificationsModule {}
