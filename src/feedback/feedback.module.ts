// src/feedback/feedback.module.ts
import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { AdminFeedbackController } from './admin-feedback.controller';
import { FeedbackService } from './feedback.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeedbackController, AdminFeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
