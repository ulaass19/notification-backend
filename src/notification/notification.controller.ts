// src/notification/notification.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { OneSignalService } from './onesignal.service';

@Controller('admin/notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly oneSignalService: OneSignalService,
  ) {}

  // Şimdilik herhangi JWT'li kullanıcı erişebilsin; ileride admin role ekleriz
  @UseGuards(JwtAuthGuard)
  @Post()
  async createAndSend(@Body() body: CreateNotificationDto) {
    // Artık burada:
    // - scheduledAt doluysa → sadece DB'ye planlı kayıt atıyoruz (SCHEDULED)
    // - boşsa → hemen gönderiyoruz (SENT / FAILED)
    return this.notificationService.createAndSendNow(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Query('page') page = '1', @Query('limit') limit = '20') {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    return this.notificationService.list(pageNum, limitNum);
  }

  // === Edit sayfası: tek bildirim detay ===
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.getById(id);
  }

  // === Edit sayfası: başlık / içerik / scheduledAt güncelle ===
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNotificationDto,
  ) {
    return this.notificationService.update(id, dto);
  }

  // === "Tekrar gönder" / "Şimdi gönder" butonu ===
  @UseGuards(JwtAuthGuard)
  @Post(':id/send-now')
  async sendNow(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.sendNowExisting(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.notificationService.delete(Number(id));
  }

  // === "İptal et" butonu ===
  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancel(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.cancel(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('meta/onesignal-status')
  getOneSignalStatus() {
    return this.oneSignalService.getStatus();
  }
}
