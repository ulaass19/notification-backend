import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitSurveyDto } from './dto/submit-survey.dto';

function now() {
  return new Date();
}

@Injectable()
export class MobileSurveysService {
  constructor(private prisma: PrismaService) {}

  private ensureUserId(userId: number) {
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new UnauthorizedException('Geçersiz kullanıcı. Lütfen tekrar giriş yap.');
    }
  }

  /**
   * ✅ Aktif anket: published + time window + user daha önce cevaplamamış
   */
  async getActiveSurveyForUser(userId: number) {
    this.ensureUserId(userId);
    const t = now();

    // findFirst → take:1 yerine daha temiz
    const survey = await this.prisma.survey.findFirst({
      where: {
        status: 'PUBLISHED',
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: t } }] },
          { OR: [{ endAt: null }, { endAt: { gte: t } }] },
        ],
        responses: { none: { userId } }, // ✅ userId artık garanti
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        createdAt: true,
      },
    });

    return survey ?? null;
  }

  async getSurveyDetail(id: number) {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!survey) throw new NotFoundException('Anket bulunamadı.');
    if (survey.status !== 'PUBLISHED') throw new NotFoundException('Anket aktif değil.');

    const t = now();
    if (survey.startAt && survey.startAt > t) throw new NotFoundException('Anket henüz başlamadı.');
    if (survey.endAt && survey.endAt < t) throw new NotFoundException('Anket süresi doldu.');

    return survey;
  }

  async submit(userId: number, surveyId: number, dto: SubmitSurveyDto) {
    this.ensureUserId(userId);
    const t = now();

    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: { questions: { include: { options: true } } },
    });
    if (!survey) throw new NotFoundException('Anket bulunamadı.');
    if (survey.status !== 'PUBLISHED') throw new BadRequestException('Anket aktif değil.');
    if (survey.startAt && survey.startAt > t) throw new BadRequestException('Anket henüz başlamadı.');
    if (survey.endAt && survey.endAt < t) throw new BadRequestException('Anket süresi doldu.');

    const existing = await this.prisma.surveyResponse.findUnique({
      where: { userId_surveyId: { userId, surveyId } },
    });
    if (existing) throw new ConflictException('Bu ankete zaten cevap verdin.');

    if (!dto.answers?.length) throw new BadRequestException('Cevaplar boş olamaz.');

    const qMap = new Map<number, { optionIds: Set<number> }>();
    for (const q of survey.questions) {
      qMap.set(q.id, { optionIds: new Set(q.options.map((o) => o.id)) });
    }

    const seenQ = new Set<number>();
    for (const a of dto.answers) {
      if (!qMap.has(a.questionId)) {
        throw new BadRequestException(`Geçersiz questionId: ${a.questionId}`);
      }
      if (seenQ.has(a.questionId)) {
        throw new BadRequestException(`Aynı soru 2 kez gönderilemez: ${a.questionId}`);
      }
      seenQ.add(a.questionId);

      const allowed = qMap.get(a.questionId)!.optionIds;
      if (!allowed.has(a.optionId)) {
        throw new BadRequestException(
          `optionId (${a.optionId}) bu soruya ait değil (questionId: ${a.questionId})`,
        );
      }
    }

    if (seenQ.size !== survey.questions.length) {
      throw new BadRequestException('Tüm sorular cevaplanmalı.');
    }

    return this.prisma.surveyResponse.create({
      data: {
        userId,
        surveyId,
        answers: {
          create: dto.answers.map((a) => ({
            questionId: a.questionId,
            optionId: a.optionId,
          })),
        },
      },
      include: { answers: true },
    });
  }
}
