import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { OneSignalService } from './onesignal.service';
import { Prisma, NotificationStatus } from '@prisma/client';
import { UpdateNotificationDto } from './dto/update-notification.dto';

// ✅ SSE Stream Service
import { NotificationStreamService } from '../notification/realtime/notification-stream.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private oneSignal: OneSignalService,
    private stream: NotificationStreamService,
  ) {}

  private async logSendAttempt(params: {
    notificationId: number;
    attempt: number;
    statusBefore: NotificationStatus;
    statusAfter: NotificationStatus;
    success: boolean;
    error?: string | null;
    provider?: string;
    providerId?: string | null;
  }) {
    const {
      notificationId,
      attempt,
      statusBefore,
      statusAfter,
      success,
      error,
      provider = 'onesignal',
      providerId = null,
    } = params;

    await this.prisma.notificationLog.create({
      data: {
        notificationId,
        attempt,
        statusBefore,
        statusAfter,
        success,
        error: error ?? null,
        provider,
        providerId,
      },
    });
  }

  async delete(id: number) {
    const exists = await this.prisma.notification.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Notification not found');

    await this.prisma.notification.delete({ where: { id } });
    return { success: true };
  }

  async createAndSendNow(dto: CreateNotificationDto) {
    const rawSchedule =
      ((dto as any).scheduledAt ?? (dto as any).sendAt ?? '').trim?.() ?? '';

    let scheduledDate: Date | null = null;
    if (rawSchedule) {
      const d = new Date(rawSchedule);
      if (!Number.isNaN(d.getTime())) scheduledDate = d;
    }

    const now = new Date();

    const data: any = {
      title: dto.title,
      body: dto.body,
      sentAt: null,
      error: null,
      retryCount: 0,
    };

    if (scheduledDate && scheduledDate.getTime() > now.getTime()) {
      data.sendAt = scheduledDate;
      data.status = NotificationStatus.SCHEDULED;
    } else {
      data.sendAt = scheduledDate ?? now;
      data.status = NotificationStatus.PENDING;
    }

    const notification = await this.prisma.notification.create({ data });

    if ((dto as any).audienceId) {
      await this.prisma.notificationAudience.create({
        data: {
          notificationId: notification.id,
          audienceId: (dto as any).audienceId,
        },
      });
    }

    if (notification.status === NotificationStatus.SCHEDULED) {
      return { notification, scheduled: true };
    }

    return this.sendNowExisting(notification.id);
  }

  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        audiences: { include: { audience: true } },
        logs: true,
      } as any,
    });

    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  async update(id: number, dto: UpdateNotificationDto) {
    const data: Record<string, any> = {};

    if (typeof dto.title === 'string') data.title = dto.title;
    if (typeof dto.body === 'string') data.body = dto.body;

    const rawSchedule =
      ((dto as any).scheduledAt ?? (dto as any).sendAt ?? '').trim?.() ?? '';

    if (rawSchedule.length > 0) {
      const d = new Date(rawSchedule);
      if (!Number.isNaN(d.getTime())) {
        data.sendAt = d;
        const now = new Date();
        data.status =
          d.getTime() > now.getTime()
            ? NotificationStatus.SCHEDULED
            : NotificationStatus.PENDING;
      }
    }

    if (
      Object.keys(data).length === 0 &&
      (dto as any).audienceId === undefined
    ) {
      return this.getById(id);
    }

    const updated = Object.keys(data).length
      ? await this.prisma.notification.update({ where: { id }, data })
      : await this.prisma.notification.findUnique({ where: { id } });

    if (!updated) throw new NotFoundException('Notification not found');

    if ((dto as any).audienceId !== undefined) {
      const existingLink = await this.prisma.notificationAudience.findFirst({
        where: { notificationId: id },
      });

      if (existingLink) {
        await this.prisma.notificationAudience.update({
          where: { id: existingLink.id },
          data: { audienceId: (dto as any).audienceId },
        });
      } else {
        await this.prisma.notificationAudience.create({
          data: {
            notificationId: id,
            audienceId: (dto as any).audienceId,
          },
        });
      }
    }

    return updated;
  }

  // ✅✅✅ External ID + fallback subscriptionId ile gönder (push gittiği an SENT + inbox yaz)
  async sendNowExisting(id: number) {
    this.logger.log(`[sendNowExisting] notifId=${id}`);

    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) throw new NotFoundException('Notification not found');

    if (notification.status === NotificationStatus.SENT) {
      return { notification, skipped: true, reason: 'Already SENT' };
    }

    const attempt = (notification.retryCount ?? 0) + 1;

    await this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.PENDING, retryCount: attempt },
    });

    const chunk = <T>(arr: T[], size = 1000) => {
      const out: T[][] = [];
      for (let i = 0; i < arr.length; i += size)
        out.push(arr.slice(i, i + size));
      return out;
    };

    const buildWhereFromRules = (rules: any[]): Prisma.UserWhereInput => {
      const AND: Prisma.UserWhereInput[] = [];

      for (const r of rules ?? []) {
        const field = String(r?.field ?? '');
        const op = String(r?.operator ?? '');
        const value = r?.value;

        if (!field || !op) continue;
        if (
          value === undefined ||
          value === null ||
          String(value).trim() === ''
        )
          continue;

        if (field === 'gender' && op === 'EQUALS') AND.push({ gender: value });
        if (field === 'city' && op === 'EQUALS') AND.push({ city: value });

        if (field === 'interests' && op === 'CONTAINS') {
          AND.push({ interests: { has: value } as any });
        }
      }

      return AND.length ? { AND } : {};
    };

    try {
      const link = await this.prisma.notificationAudience.findFirst({
        where: { notificationId: id },
        include: { audience: true },
      });

      let where: Prisma.UserWhereInput = { isActive: true };

      if (link?.audience?.rules) {
        const rulesWhere = buildWhereFromRules(link.audience.rules as any[]);
        where = { ...where, ...rulesWhere };
      }

      // ✅ deviceId de çekiyoruz (subscriptionId)
      const users = await this.prisma.user.findMany({
        where,
        select: { id: true, deviceId: true },
      });

      if (users.length === 0) {
        throw new BadRequestException('Audience matched 0 users');
      }

      const externalUserIds = users.map((u) => String(u.id)).filter(Boolean);

      // ✅ SSE EMIT (push’tan bağımsız)
      for (const u of users) {
        this.stream.emitToUser(String(u.id), {
          type: 'notification',
          id: notification.id,
          title: notification.title,
          body: notification.body,
          data: { screen: 'DailyStatus', notificationId: notification.id },
        });
      }

      const results: any[] = [];

      // 1) external_id ile gönder
      for (const part of chunk(externalUserIds, 1000)) {
        const r = await this.oneSignal.sendToExternalUserIds(
          part,
          notification.title,
          notification.body,
        );
        results.push({ mode: 'external_id', ...r });
      }

      const externalRecipients = results
        .filter((x) => x?.mode === 'external_id')
        .reduce((sum, r) => sum + Number(r?.recipients ?? 0), 0);

      let finalMode: 'external_id' | 'subscription_fallback' = 'external_id';
      let finalRecipients = externalRecipients;

      // 2) fallback: subscriptionId (deviceId) ile gönder
      if (externalRecipients <= 0) {
        const usersWithSub = users
          .filter(
            (u: any) =>
              typeof u.deviceId === 'string' && u.deviceId.trim().length > 0,
          )
          .map((u: any) => ({ id: u.id, subId: String(u.deviceId).trim() }));

        const subscriptionIds = usersWithSub.map((x) => x.subId);

        if (subscriptionIds.length > 0) {
          const fb: any[] = [];
          for (const part of chunk(subscriptionIds, 2000)) {
            const r = await this.oneSignal.sendToSubscriptionIds(
              part,
              notification.title,
              notification.body,
            );
            fb.push({ mode: 'subscription_fallback', ...r });
          }

          const fallbackRecipients = fb.reduce(
            (sum, r) => sum + Number(r?.recipients ?? 0),
            0,
          );

          results.push(...fb);

          if (fallbackRecipients > 0) {
            finalMode = 'subscription_fallback';
            finalRecipients = fallbackRecipients;

            // ✅ INBOX: fallback ile gerçekten push giden user’lar
            await this.prisma.userNotification.createMany({
              data: usersWithSub.map((x) => ({
                userId: x.id,
                notificationId: notification.id,
              })),
              skipDuplicates: true,
            });
          }
        }
      }

      // ✅ external_id başarılıysa inbox: tüm audience users
      if (finalMode === 'external_id' && finalRecipients > 0) {
        await this.prisma.userNotification.createMany({
          data: users.map((u) => ({
            userId: u.id,
            notificationId: notification.id,
          })),
          skipDuplicates: true,
        });
      }

      // 3) hala 0 ise fail
      if (finalRecipients <= 0) {
        throw new BadRequestException(
          'OneSignal recipients=0. External ID eşleşmiyor ve subscriptionId yok/boş.',
        );
      }

      // ✅ artık BAŞARILI: SENT + sentAt set
      const updated = await this.prisma.notification.update({
        where: { id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          error: null,
          retryCount: attempt,
        },
      });

      await this.logSendAttempt({
        notificationId: id,
        attempt,
        statusBefore: NotificationStatus.PENDING,
        statusAfter: NotificationStatus.SENT,
        success: true,
        error: null,
        providerId: results?.find((x) => x?.id)?.id ?? null,
      });

      return {
        notification: updated,
        onesignal: results,
        recipients: finalRecipients,
        mode: finalMode,
      };
    } catch (err: any) {
      const errorMessage = err?.response?.data
        ? JSON.stringify(err.response.data)
        : (err?.message ?? 'Unknown error');

      const updated = await this.prisma.notification.update({
        where: { id },
        data: {
          status: NotificationStatus.FAILED,
          error: errorMessage,
          retryCount: attempt,
        },
      });

      await this.logSendAttempt({
        notificationId: id,
        attempt,
        statusBefore: NotificationStatus.PENDING,
        statusAfter: NotificationStatus.FAILED,
        success: false,
        error: errorMessage,
      });

      return {
        notification: updated,
        error: 'OneSignal send failed',
        details: errorMessage,
      };
    }
  }

  async cancel(id: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.FAILED,
        error: 'Canceled by admin',
      },
    });
  }
}
