// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto';
import { FindAllUsersQueryDto } from './dto/find-all-users.dto';
import { Prisma } from '@prisma/client';

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
        isActive: true, // 👈 durum
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
        role: true, // admin için de lazım
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      role,
      createdFrom,
      createdTo,
      // FindAllUsersQueryDto içine boolean isActive alanı eklediğimizi varsayıyoruz
      isActive,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    // Global search (ID / ad / e-posta)
    if (search && search.trim().length > 0) {
      const s = search.trim();
      const idNum = Number(s);

      const searchOr: Prisma.UserWhereInput[] = [
        {
          fullName: {
            contains: s,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: s,
            mode: 'insensitive',
          },
        },
      ];

      if (!Number.isNaN(idNum)) {
        searchOr.push({ id: idNum });
      }

      where.OR = searchOr;
    }

    // Ad soyad filtresi
    if (fullName && fullName.trim().length > 0) {
      where.fullName = {
        contains: fullName.trim(),
        mode: 'insensitive',
      };
    }

    // E-posta filtresi
    if (email && email.trim().length > 0) {
      where.email = {
        contains: email.trim(),
        mode: 'insensitive',
      };
    }

    // Rol filtresi
    if (role) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where.role = role;
    }

    // Durum filtresi (aktif / pasif)
    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    // Kayıt tarihi filtresi
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
          isActive: true, // 👈 listede de dönüyoruz
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
    // ✅ deviceId undefined ise overwrite etmesin diye data objesini dinamik kuruyoruz
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
    };

    // 🔥 KRİTİK: OneSignal playerId burada yazılacak
    if (dto.deviceId !== undefined) {
      data.deviceId = dto.deviceId;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    // Güncel haliyle kullanıcıyı geri döndürelim
    return this.getById(userId);
  }

  // === Admin tarafından herhangi bir kullanıcıyı güncellemek için ===
  async updateByAdmin(userId: number, dto: UpdateUserByAdminDto) {
    const data: Prisma.UserUpdateInput = {
      fullName: dto.fullName,
      email: dto.email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      role: dto.role,
      birthYear: dto.birthYear,
      gender: dto.gender,
      maritalStatus: dto.maritalStatus,
      city: dto.city,
      occupation: dto.occupation,
      isEmailVerified: dto.isEmailVerified,
    };

    // (Opsiyonel) Admin tarafında da deviceId set edilebilsin istersen:
    // Eğer UpdateUserByAdminDto içinde deviceId yoksa, bunu kaldırabilirsin.
    // @ts-ignore
    if (dto.deviceId !== undefined) {
      // @ts-ignore
      data.deviceId = dto.deviceId;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.getById(userId);
  }

  // === Admin: status switch endpoint'i ===
  async updateStatus(id: number, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        isActive: true,
      },
    });
  }

  // === Admin tarafından herhangi bir kullanıcıyı SİLMEK için ===
  async deleteUser(id: number) {
    await this.prisma.user.delete({
      where: { id },
    });

    return { success: true };
  }
}
