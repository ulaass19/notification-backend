import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto';
import { FindAllUsersQueryDto } from './dto/find-all-users.dto';
import { Prisma, ComfortZone } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        isEmailVerified: true,
        isActive: true,
        deviceId: true,
        createdAt: true,

        birthYear: true,
        gender: true,
        city: true,
        occupation: true,
        educationLevel: true,
        maritalStatus: true,
        interests: true,
        primaryGoal: true,
        goalTimeframe: true,
        dailyAppTime: true,
        activeTimeOfDay: true,
        socialMediaUsage: true,
        stressLevel: true,
        preferredContent: true,
        selfDescriptionWords: true,
        personalityTraits: true,
        mainMotivation: true,
        biggestStruggle: true,

        // ✅ NovaMe / DailySpark alanları da dönsün
        energyDipTime: true,
        comfortZones: true,
        petName: true,
        negativeSelfTalk: true,
        workContext: true,
        toneOfVoice: true,
        bigDayDate: true,
        bigDayType: true,
        bigDayLabel: true,
        hasChildren: true,
        childrenAgeRange: true,

        role: true,
      },
    });
  }

  // === Admin panel: filtreli kullanıcı listesi ===
  async listUsers(query: FindAllUsersQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      fullName,
      email,

      role,
      createdFrom,
      createdTo,
      isActive,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search && search.trim().length > 0) {
      const s = search.trim();
      const idNum = Number(s);

      const searchOr: Prisma.UserWhereInput[] = [
        { fullName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
      ];

      if (!Number.isNaN(idNum)) {
        searchOr.push({ id: idNum });
      }

      where.OR = searchOr;
    }

    if (fullName && fullName.trim().length > 0) {
      where.fullName = { contains: fullName.trim(), mode: 'insensitive' };
    }

    if (email && email.trim().length > 0) {
      where.email = { contains: email.trim(), mode: 'insensitive' };
    }

    if (role) {
      where.role = role;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) {
        (where.createdAt as Prisma.DateTimeFilter).gte = new Date(createdFrom);
      }
      if (createdTo) {
        (where.createdAt as Prisma.DateTimeFilter).lte = new Date(createdTo);
      }
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          isEmailVerified: true,
          isActive: true,
          deviceId: true,
          createdAt: true,
          birthYear: true,
          gender: true,
          city: true,
          occupation: true,
          educationLevel: true,
          maritalStatus: true,
          primaryGoal: true,
          goalTimeframe: true,
          stressLevel: true,
          role: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    // comfortZones iş kuralı:
    const cz = dto.comfortZones ?? undefined;
    const hasPet = Array.isArray(cz) && cz.includes(ComfortZone.PLAY_WITH_PET);

    const data: Prisma.UserUpdateInput = {
      fullName: dto.fullName,
      birthYear: dto.birthYear,
      gender: dto.gender,
      city: dto.city,
      occupation: dto.occupation,
      educationLevel: dto.educationLevel,
      maritalStatus: dto.maritalStatus,
      interests: dto.interests,
      primaryGoal: dto.primaryGoal,
      goalTimeframe: dto.goalTimeframe,
      dailyAppTime: dto.dailyAppTime,
      activeTimeOfDay: dto.activeTimeOfDay,
      socialMediaUsage: dto.socialMediaUsage,
      stressLevel: dto.stressLevel,
      preferredContent: dto.preferredContent,
      selfDescriptionWords: dto.selfDescriptionWords,
      personalityTraits: dto.personalityTraits,
      mainMotivation: dto.mainMotivation,
      biggestStruggle: dto.biggestStruggle,

      // ✅ NovaMe / DailySpark map
      energyDipTime: dto.energyDipTime,
      comfortZones: dto.comfortZones,
      negativeSelfTalk: dto.negativeSelfTalk,
      workContext: dto.workContext,
      toneOfVoice: dto.toneOfVoice,
      bigDayType: dto.bigDayType,
      bigDayLabel: dto.bigDayLabel,
      hasChildren: dto.hasChildren,
      childrenAgeRange: dto.childrenAgeRange,
    };

    // 🔥 KRİTİK: OneSignal playerId burada yazılacak
    if (dto.deviceId !== undefined) {
      data.deviceId = dto.deviceId;
    }

    // bigDayDate string geliyor -> Date'e çevir
    if (dto.bigDayDate !== undefined) {
      data.bigDayDate = dto.bigDayDate ? new Date(dto.bigDayDate) : null;
    }

    // petName kuralı
    if (!hasPet) {
      data.petName = null;
    } else if (dto.petName !== undefined) {
      const v = (dto.petName ?? '').trim();
      data.petName = v.length ? v : null;
    }

    // hasChildren false ise ageRange temizle (DTO göndermese bile garanti)
    if (dto.hasChildren === false) {
      data.childrenAgeRange = null;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.getById(userId);
  }

  // === Admin tarafından herhangi bir kullanıcıyı güncellemek için ===
  async updateByAdmin(userId: number, dto: UpdateUserByAdminDto) {
    const data: Prisma.UserUpdateInput = {
      fullName: dto.fullName,
      email: dto.email,

      role: dto.role,
      birthYear: dto.birthYear,
      gender: dto.gender,
      maritalStatus: dto.maritalStatus,
      city: dto.city,
      occupation: dto.occupation,
      isEmailVerified: dto.isEmailVerified,
    };

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.getById(userId);
  }

  async updateStatus(id: number, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, isActive: true },
    });
  }

  async deleteUser(id: number) {
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
