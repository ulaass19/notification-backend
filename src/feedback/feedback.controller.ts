// src/feedback/feedback.controller.ts
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Controller('mobile')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @UseGuards(JwtAuthGuard)
  @Post('feedback')
  async createFeedback(@Req() req: Request, @Body() body: CreateFeedbackDto) {
    const user = req.user as { userId: number };
    return this.feedbackService.create(user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feedback')
  async listMyFeedbacks(@Req() req: Request) {
    const user = req.user as { userId: number };
    return this.feedbackService.listForUser(user.userId);
  }
}
