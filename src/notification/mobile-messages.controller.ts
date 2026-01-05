import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MobileMessagesService } from './mobile-messages.service';

@Controller('mobile/messages')
export class MobileMessagesController {
  constructor(private readonly messagesService: MobileMessagesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: any, @Query('days') days = '3') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = Number(req.user?.id);
    return this.messagesService.getMessages(userId, Number(days) || 3);
  }
}
