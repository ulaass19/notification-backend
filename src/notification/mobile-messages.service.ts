import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MobileMessagesService {
  constructor(private prisma: PrismaService) {}

  async getMessages(userId: number, days = 3) {
    const safeDays = Math.max(1, Math.min(30, Number(days) || 3));
    const from = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const items = await this.prisma.userNotification.findMany({
      where: {
        userId,
        deliveredAt: { gte: from },
      },
      orderBy: { deliveredAt: 'desc' },
      include: {
        notification: {
          select: {
            id: true,
            title: true,
            body: true,
            sendAt: true,
            status: true,
            createdAt: true,
          },
        },
        feedback: {
          select: {
            id: true,
            rating: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { days: safeDays, items };
  }
}
