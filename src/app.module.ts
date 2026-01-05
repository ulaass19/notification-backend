import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { FeedbackModule } from './feedback/feedback.module';
import { NotificationModule } from './notification/notification.module';
import { AdminUserController } from './user/admin-user.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { AudiencesModule } from './audiences/audiences.module';
import { MobileModule } from './mobile/mobile.module';
import { RealtimeModule } from './realtime/realtime.module';
import { UserNotificationsModule } from './user-notifications/user-notifications.module';
import { SurveysModule } from './surveys/surveys.module';
import { MobileSurveysModule } from './mobile-surveys/mobile-surveys.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule, // sen hangilerini eklediysen
    UserModule,
    FeedbackModule,
    NotificationModule,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ScheduleModule.forRoot(),
    AudiencesModule,
    MobileModule,
    RealtimeModule,
    UserNotificationsModule,
    SurveysModule,
    MobileSurveysModule,
  ],
  controllers: [AppController, AdminUserController],
  providers: [AppService],
})
export class AppModule {}
