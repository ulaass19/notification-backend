import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { Prisma } from '@prisma/client';

type Rule = {
  field: string; // örn: "city", "gender", "status", "deviceId"
  op: 'eq' | 'ne' | 'contains' | 'in' | 'notIn' | 'isNull' | 'notNull';
  value?: any;
};

@Injectable()
export class AudiencesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateAudienceDto) {
    return this.prisma.audience.create({
      data: {
        name: dto.name,
        description: dto.description,
        rules: dto.rules, // Json - dinamik segment kuralları
      },
    });
  }

  // ✅ Panelde kullanıcı sayısı dolsun diye userCount ekliyoruz
  async findAll() {
    const audiences = await this.prisma.audience.findMany({
      orderBy: { id: 'desc' },
    });

    const withCounts = await Promise.all(
      audiences.map(async (a) => {
        const userCount = await this.countUsersForAudience(a.id);
        return { ...a, userCount };
      }),
    );

    return withCounts;
  }

  async findOne(id: number) {
    const audience = await this.prisma.audience.findUnique({
      where: { id },
    });

    if (!audience) {
      throw new NotFoundException('Kitle bulunamadı.');
    }

    return audience;
  }

  update(id: number, dto: UpdateAudienceDto) {
    return this.prisma.audience.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  remove(id: number) {
    return this.prisma.audience.delete({
      where: { id },
    });
  }

  // ===============================
  // ✅ ASIL EKSİK OLAN KISIM: RESOLVE
  // ===============================

  async resolveUsersForAudience(audienceId: number) {
    const audience = await this.findOne(audienceId);
    const where = this.buildUserWhereFromRules(audience.rules);

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        deviceId: true,
        // ihtiyacın varsa: name/surname vs ekle
      },
    });
  }

  async countUsersForAudience(audienceId: number) {
    const audience = await this.findOne(audienceId);
    const where = this.buildUserWhereFromRules(audience.rules);
    return this.prisma.user.count({ where });
  }

  // rules JSON -> Prisma where
  private buildUserWhereFromRules(rulesJson: any): Prisma.UserWhereInput {
    // ✅ DEFAULT DAVRANIŞ:
    // Kural yoksa: push atılabilecek herkes (deviceId dolu)
    const baseWhere: Prisma.UserWhereInput = {
      deviceId: { not: null },
    };

    // rules boşsa direkt baseWhere dön
    if (!rulesJson) return baseWhere;

    // Bazı yerlerde rules array, bazı yerlerde { rules: [...] } geliyor olabilir:
    const rules: Rule[] = Array.isArray(rulesJson)
      ? rulesJson
      : Array.isArray(rulesJson?.rules)
        ? rulesJson.rules
        : [];

    if (!rules.length) return baseWhere;

    // Her rule -> Prisma condition
    const andConditions: Prisma.UserWhereInput[] = rules.map((r) =>
      this.ruleToWhere(r),
    );

    return {
      AND: [baseWhere, ...andConditions],
    };
  }

  private ruleToWhere(rule: Rule): Prisma.UserWhereInput {
    const field = rule.field as keyof Prisma.UserWhereInput;

    // Prisma where input'ta dynamic key kullanacağız
    // @ts-ignore
    switch (rule.op) {
      case 'eq':
        return { [field]: rule.value };
      case 'ne':
        return { NOT: { [field]: rule.value } };
      case 'contains':
        return { [field]: { contains: rule.value, mode: 'insensitive' } };
      case 'in':
        return { [field]: { in: Array.isArray(rule.value) ? rule.value : [rule.value] } };
      case 'notIn':
        return { [field]: { notIn: Array.isArray(rule.value) ? rule.value : [rule.value] } };
      case 'isNull':
        return { [field]: null };
      case 'notNull':
        return { [field]: { not: null } };
      default:
        // bilinmeyen op gelirse kitleyi patlatmasın
        return {};
    }
  }
}
