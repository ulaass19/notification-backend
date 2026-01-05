// src/user/admin-user.controller.ts
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

@ApiTags('AdminUser')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/users')
export class AdminUserController {
  constructor(private prisma: PrismaService) {}

  private assertAdmin(req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const user: any = (req as any).user;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Sadece admin kullanıcılar bu işlemi yapabilir',
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    this.assertAdmin(req);

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        birthYear: true,
        gender: true,
        maritalStatus: true,
        city: true,
        occupation: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    return user;
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserByAdminDto,
    @Req() req: Request,
  ) {
    this.assertAdmin(req);

    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        birthYear: true,
        gender: true,
        maritalStatus: true,
        city: true,
        occupation: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    return updated;
  }
}
