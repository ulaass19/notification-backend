import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { PublishSurveyDto } from './dto/publish-survey.dto';
import { SurveyStatus } from '@prisma/client';

@Injectable()
export class SurveysService {
  constructor(private prisma: PrismaService) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async create(dto: CreateSurveyDto) {
    if (!dto.questions?.length)
      throw new BadRequestException('En az 1 soru gerekli.');
    for (const q of dto.questions) {
      if (!q.options?.length || q.options.length < 2) {
        throw new BadRequestException('Her soru için en az 2 seçenek gerekli.');
      }
    }

    const startAt = dto.startAt ? new Date(dto.startAt) : null;
    const endAt = dto.endAt ? new Date(dto.endAt) : null;
    if (startAt && endAt && startAt > endAt) {
      throw new BadRequestException("startAt endAt'ten büyük olamaz.");
    }

    const audienceIds = Array.isArray(dto.audienceIds) ? dto.audienceIds : [];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.survey.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        startAt,
        endAt,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        status: SurveyStatus.DRAFT,
        questions: {
          create: dto.questions.map((q) => ({
            text: q.text,
            order: q.order ?? 0,
            options: {
              create: q.options.map((o) => ({
                text: o.text,
                order: o.order ?? 0,
              })),
            },
          })),
        },
        audiences: audienceIds.length
          ? { create: audienceIds.map((audienceId) => ({ audienceId })) }
          : undefined,
      },
      include: {
        audiences: true,
        questions: { include: { options: true }, orderBy: { order: 'asc' } },
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async findAll() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.survey.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        audiences: { include: { audience: true } },
        _count: { select: { responses: true } },
      },
    });
  }

  async findOne(id: number) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const survey = await this.prisma.survey.findUnique({
      where: { id },
      include: {
        audiences: { include: { audience: true } },
        questions: { include: { options: true }, orderBy: { order: 'asc' } },
      },
    });
    if (!survey) throw new NotFoundException('Anket bulunamadı.');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return survey;
  }

  async update(id: number, dto: UpdateSurveyDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const existing = await this.prisma.survey.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Anket bulunamadı.');

    const startAt = dto.startAt ? new Date(dto.startAt) : undefined;
    const endAt = dto.endAt ? new Date(dto.endAt) : undefined;

    // audienceIds gelirse, mapping'i replace edelim
    const audienceIds = dto.audienceIds ? dto.audienceIds : null;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.survey.update({
      where: { id },
      data: {
        title: dto.title,
        description:
          dto.description === undefined ? undefined : (dto.description ?? null),
        startAt,
        endAt,
        audiences: audienceIds
          ? {
              deleteMany: {},
              create: audienceIds.map((audienceId) => ({ audienceId })),
            }
          : undefined,
      },
      include: {
        audiences: { include: { audience: true } },
        questions: { include: { options: true }, orderBy: { order: 'asc' } },
      },
    });
  }

  async publish(id: number, dto: PublishSurveyDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const existing = await this.prisma.survey.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Anket bulunamadı.');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const startAt = dto.startAt ? new Date(dto.startAt) : existing.startAt;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const endAt = dto.endAt ? new Date(dto.endAt) : existing.endAt;
    if (startAt && endAt && startAt > endAt) {
      throw new BadRequestException("startAt endAt'ten büyük olamaz.");
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.survey.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      data: { status: SurveyStatus.PUBLISHED, startAt, endAt },
    });
  }

  async archive(id: number) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const existing = await this.prisma.survey.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Anket bulunamadı.');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.survey.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      data: { status: SurveyStatus.ARCHIVED },
    });
  }
}
