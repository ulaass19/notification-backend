import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  Patch,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
import { UserNotificationsService } from './user-notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('user-notifications')
export class UserNotificationsController {
  constructor(private readonly service: UserNotificationsService) {}

  @Get('recent')
  recent(@Req() req: Request, @Query('limit') limit?: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as any).id; // JWT payload → id
    const take = Math.min(Math.max(Number(limit || 3), 1), 20);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.service.getRecentForUser(userId, take);
  }

  /**
   * ✅ Bildirime tıklanınca "openedAt" set et
   * PATCH /user-notifications/:id/open
   */
  @Patch(':id/open')
  async open(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as any).id;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const updated = await this.service.markOpened(userId, id);

    if (!updated) {
      // kendi kaydı değilse ya da yoksa
      throw new NotFoundException('Notification not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return updated;
  }
}
