// src/notification/notification.scheduler.ts
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

  /**
   * Her 30 saniyede bir SCHEDULED bildirimleri kontrol eder.
   *
   * Burada sadece:
   *  - SCHEDULED & sendAt <= now olan kayıtları buluyoruz
   *  - Her biri için NotificationService.sendNowExisting(id) çağırıyoruz
   *
   * Böylece:
   *  - Tüm OneSignal çağrıları
   *  - retryCount artırma
   *  - NotificationLog’a log yazma
   * tek bir yerde (NotificationService) toplanmış oluyor.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processScheduledNotifications() {
    this.logger.debug(
      '⏱ Cron çalıştı: scheduled bildirimler kontrol ediliyor...',
    );

    const now = new Date();

    const scheduled = await this.prisma.notification.findMany({
      where: {
        status: NotificationStatus.SCHEDULED,
        sendAt: { lte: now },
      },
    });

    if (!scheduled.length) {
      return;
    }

    this.logger.log(
      `🚀 Gönderilecek scheduled bildirim sayısı: ${scheduled.length}`,
    );

    for (const notif of scheduled) {
      try {
        // Tüm gönderim/retry/log mantığı service içinde
        const result = await this.notificationService.sendNowExisting(notif.id);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if ((result as any)?.skipped) {
          this.logger.warn(
            `⛔ Bildirim ${notif.id} cron tarafından skip edildi: ${
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            err?.message ?? 'Unknown error'
          }`,
        );
      }
    }
  }
}
