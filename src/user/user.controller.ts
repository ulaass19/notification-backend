// src/user/user.controller.ts
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Query,
  Req,
  UseGuards,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import type { Request } from 'express';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto';
import { UserRole } from '@prisma/client';
import { FindAllUsersQueryDto } from './dto/find-all-users.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('mobile')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ADMIN check'i: user varsa yeter; eğer role alanı varsa ve ADMIN değilse, o zaman yasakla
  private assertAdmin(req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const user: any = (req as any).user;

    if (!user) {
      throw new ForbiddenException('Giriş yapılmalı');
    }

    // role alanı varsa ve ADMIN değilse yasakla
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (user.role && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Sadece admin kullanıcılar bu işlemi yapabilir',
      );
    }
  }

  // === Mobil kullanıcının kendisi ===
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request) {
    const user = req.user as { userId: number };
    return this.userService.getById(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: Request,
  ) {
    this.assertAdmin(req);
    return this.userService.updateStatus(id, dto.isActive);
  }

  // === Admin panel: kullanıcı listesi (filtreli) ===
  @UseGuards(JwtAuthGuard)
  @Get('users')
  async listUsers(@Query() query: FindAllUsersQueryDto, @Req() req: Request) {
    this.assertAdmin(req);
    return this.userService.listUsers(query);
  }

  // === Admin panel: tek kullanıcıyı çek (GET /mobile/users/:id) ===
  @UseGuards(JwtAuthGuard)
  @Get('users/:id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    this.assertAdmin(req);
    return this.userService.getById(id);
  }

  // === Mobil kullanıcının kendi profilini güncellemesi ===
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Req() req: Request, @Body() body: UpdateProfileDto) {
    const user = req.user as { userId: number };
    return this.userService.updateProfile(user.userId, body);
  }

  // === Admin panel: herhangi bir kullanıcıyı güncelle (PATCH /mobile/users/:id) ===
  @UseGuards(JwtAuthGuard)
  @Patch('users/:id')
  async updateUserByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserByAdminDto,
    @Req() req: Request,
  ) {
    this.assertAdmin(req);
    return this.userService.updateByAdmin(id, dto);
  }

  // === Admin panel: herhangi bir kullanıcıyı SİL (DELETE /mobile/users/:id) ===
  @UseGuards(JwtAuthGuard)
  @Delete('users/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    this.assertAdmin(req);
    return this.userService.deleteUser(id);
  }
}
