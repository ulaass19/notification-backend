import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecentForUser(userId: number, limit: number) {
    const rows = await this.prisma.userNotification.findMany({
      where: { userId },
      orderBy: { deliveredAt: 'desc' },
      take: limit,
      include: {
        notification: {
          select: {
            id: true,
            title: true,
            body: true,
            status: true,
            sendAt: true,
            sentAt: true,
            createdAt: true,
          },
        },
      },
    });

    return rows.map((r) => ({
      userNotificationId: r.id,
      notificationId: r.notification.id,

      title: r.notification.title,
      body: r.notification.body,
      status: r.notification.status,

      sendAt: r.notification.sendAt,
      sentAt: r.notification.sentAt,
      createdAt: r.notification.createdAt,

      deliveredAt: r.deliveredAt,
      shownAt: r.shownAt,
      openedAt: r.openedAt,
    }));
  }

  /**
   * ✅ openedAt set (idempotent)
   * user sadece kendi kaydını güncelleyebilir
   */
  async markOpened(userId: number, userNotificationId: number) {
    const row = await this.prisma.userNotification.findFirst({
      where: { id: userNotificationId, userId },
      select: { id: true, openedAt: true },
    });

    if (!row) return null;

    if (row.openedAt) {
      // zaten açılmışsa dokunma
      return this.prisma.userNotification.findUnique({
        where: { id: userNotificationId },
      });
    }

    return this.prisma.userNotification.update({
      where: { id: userNotificationId },
      data: { openedAt: new Date() },
    });
  }
}
