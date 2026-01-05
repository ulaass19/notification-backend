// src/feedback/feedback.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  private isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  async create(userId: number, dto: CreateFeedbackDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const now = new Date();

    if (user.lastFeedbackAt && this.isSameDay(user.lastFeedbackAt, now)) {
      throw new BadRequestException(
        'Bugün zaten feedback gönderdiniz. Yarın tekrar deneyin.',
      );
    }

    const feedback = await this.prisma.feedback.create({
      data: {
        userId,
        rating: dto.rating,
        note: dto.note,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastFeedbackAt: now,
      },
    });

    return feedback;
  }

  async listForUser(userId: number) {
    return this.prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ===================== ADMIN TARAFI ===================== */

  async listAllForAdmin(params: {
    page?: number;
    limit?: number;
    search?: string;
    rating?: number;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 && params.limit <= 100
        ? params.limit
        : 20;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search && params.search.trim().length > 0) {
      const term = params.search.trim();
      where.OR = [
        { note: { contains: term, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { email: { contains: term, mode: 'insensitive' } },
              // İleride name alanı eklersen buraya da ekleyebilirsin
            ],
          },
        },
      ];
    }

    if (params.rating) {
      where.rating = params.rating;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOneForAdmin(id: number) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return feedback;
  }

  async markResolved(id: number) {
    const exists = await this.prisma.feedback.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Feedback not found');
    }

    // Şimdilik status alanı yoksa burayı boş bırakıyoruz.
    // İleride feedback tablosuna "status" ekleyince buradan RESOLVED yaparsın.
    const updated = await this.prisma.feedback.update({
      where: { id },
      data: {
        // status: 'RESOLVED' as any,
      },
    });

    return updated;
  }
}
