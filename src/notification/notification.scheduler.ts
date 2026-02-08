import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationStatus } from '@prisma/client';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processScheduledNotifications() {
    this.logger.log('🧬 SCHD:v1 running');
    this.logger.debug('⏱ Cron çalıştı: scheduled bildirimler kontrol ediliyor...');

    const now = new Date();

    const scheduled = await this.prisma.notification.findMany({
      where: {
        status: NotificationStatus.SCHEDULED,
        sendAt: { lte: now },
      },
    });

    if (!scheduled.length) return;

    this.logger.log(`🚀 Gönderilecek scheduled bildirim sayısı: ${scheduled.length}`);

    for (const notif of scheduled) {
      try {
        const result = await this.notificationService.sendNowExisting(notif.id);

        if ((result as any)?.skipped) {
          this.logger.warn(
            `⛔ Bildirim ${notif.id} cron tarafından skip edildi: ${
              (result as any).reason ?? 'bilinmeyen neden'
            }`,
          );
        } else {
          this.logger.log(
            `✅ Bildirim ${notif.id} cron üzerinden işlendi (status: SENT/FAILED service içinde set edildi).`,
          );
        }
      } catch (err: any) {
        this.logger.error(
          `❌ Bildirim ${notif.id} cron üzerinden gönderilirken hata: ${
            err?.message ?? 'Unknown error'
          }`,
        );
      }
    }
  }
}
