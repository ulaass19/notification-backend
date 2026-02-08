// src/notification/notification.service.ts
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

  /**
   * ✅ LIST (Admin Panel)
   * sentCount      = UserNotification satırı sayısı (hedeflenen/inbox)
   * deliveredCount = şimdilik sentCount ile aynı (stabil ve gerçek: inbox'a düştü)
   * openCount      = openedAt dolu olanlar
   */
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

    const ids = items.map((x) => x.id);

    if (ids.length === 0) {
      return {
        items: [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // ✅ Gönderilen (hedeflenen/inbox): UserNotification count
    const sentGroups = await this.prisma.userNotification.groupBy({
      by: ['notificationId'],
      where: { notificationId: { in: ids } },
      _count: { _all: true },
    });

    // ✅ Açılma: openedAt not null
    const openGroups = await this.prisma.userNotification.groupBy({
      by: ['notificationId'],
      where: {
        notificationId: { in: ids },
        openedAt: { not: null },
      },
      _count: { _all: true },
    });

    const sentMap = new Map<number, number>(
      sentGroups.map((g) => [g.notificationId, g._count._all]),
    );

    const openMap = new Map<number, number>(
      openGroups.map((g) => [g.notificationId, g._count._all]),
    );

    const itemsWithMetrics = items.map((n) => {
      const sentCount = sentMap.get(n.id) ?? 0;

      // ✅ Teslim: inbox’a düştü olarak stabil ölçüm
      const deliveredCount = sentCount;

      const openCount = openMap.get(n.id) ?? 0;

      return {
        ...n,
        sentCount,
        deliveredCount,
        openCount,
      };
    });

    return {
      items: itemsWithMetrics,
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

  // (sendNowExisting ve cancel fonksiyonların aynen kalsın — sende zaten doğru)
  async sendNowExisting(id: number) {
    this.logger.log(`[sendNowExisting] mode=PLAYER_ID_ONLY notifId=${id}`);

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

    const isUuid = (v: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        v,
      );

    const buildWhereFromRules = (rules: any[]): Prisma.UserWhereInput => {
      const AND: Prisma.UserWhereInput[] = [];

      for (const r of rules ?? []) {
        const field = String(r?.field ?? '');
        const op = String(r?.operator ?? '');
        const raw = r?.value;

        if (!field || !op) continue;
        if (raw === undefined || raw === null) continue;

        const value = typeof raw === 'string' ? raw.trim() : raw;
        if (value === '' || value === null) continue;

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

      const users = await this.prisma.user.findMany({
        where,
        select: { id: true, deviceId: true },
      });

      if (users.length === 0) {
        throw new BadRequestException('Audience matched 0 users');
      }

      const usersWithPlayerId = users
        .map((u) => ({
          userId: u.id,
          playerId: typeof u.deviceId === 'string' ? u.deviceId.trim() : '',
        }))
        .filter((x) => x.playerId.length > 0)
        .filter((x) => isUuid(x.playerId));

      const invalidCount =
        users.filter(
          (u) => typeof u.deviceId === 'string' && u.deviceId.trim().length > 0,
        ).length - usersWithPlayerId.length;

      this.logger.log(
        `[sendNowExisting] matchedUsers=${users.length} withValidPlayerId=${usersWithPlayerId.length} invalidOrEmptyDeviceId=${invalidCount}`,
      );

      if (usersWithPlayerId.length === 0) {
        throw new BadRequestException(
          `No valid OneSignal player_id (UUID) found. matched=${users.length}`,
        );
      }

      for (const u of users) {
        this.stream.emitToUser(String(u.id), {
          type: 'notification',
          id: notification.id,
          title: notification.title,
          body: notification.body,
          data: { screen: 'DailyStatus', notificationId: notification.id },
        });
      }

      const playerIds = usersWithPlayerId.map((x) => x.playerId);
      const r = await this.oneSignal.sendToPlayerIds(
        playerIds,
        notification.title,
        notification.body,
      );

      const recipientsRaw = r?.recipients;
      const recipients =
        typeof recipientsRaw === 'number'
          ? recipientsRaw
          : Number(recipientsRaw ?? 0);

      const providerId = r?.id ?? null;

      if (!providerId) {
        throw new BadRequestException(
          `OneSignal response has no id. Response=${JSON.stringify(r)}`,
        );
      }

      if (!Number.isFinite(recipients) || recipients <= 0) {
        this.logger.warn(
          `[sendNowExisting] OneSignal accepted but recipients=${recipients}. ` +
            `Will mark SENT anyway. (playerIds=${usersWithPlayerId.length})`,
        );
      }

      await this.prisma.userNotification.createMany({
        data: usersWithPlayerId.map((x) => ({
          userId: x.userId,
          notificationId: notification.id,
        })),
        skipDuplicates: true,
      });

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
        providerId: r?.id ?? null,
      });

      return {
        notification: updated,
        onesignal: r,
        recipients,
        mode: 'player_ids',
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
