import { Global, Module } from '@nestjs/common';
import { NotificationStreamService } from '../notification/realtime/notification-stream.service';

@Global()
@Module({
  providers: [NotificationStreamService],
  exports: [NotificationStreamService],
})
export class RealtimeModule {}
