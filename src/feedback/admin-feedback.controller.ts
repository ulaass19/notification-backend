// src/feedback/admin-feedback.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedbackService } from './feedback.service';

@UseGuards(JwtAuthGuard)
@Controller('admin/feedbacks')
export class AdminFeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  async list(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('rating') rating?: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const ratingNum = rating ? parseInt(rating, 10) : undefined;

    return this.feedbackService.listAllForAdmin({
      page: pageNum,
      limit: limitNum,
      search,
      rating: ratingNum,
    });
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.feedbackService.getOneForAdmin(id);
  }

  @Patch(':id/resolve')
  async resolve(@Param('id', ParseIntPipe) id: number) {
    return this.feedbackService.markResolved(id);
  }
}
