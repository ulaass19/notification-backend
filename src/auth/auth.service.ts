import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';
import { UserRole } from '@prisma/client'; // 🔥 role enum'u buradan geliyor

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  /**
   * JWT içine artık role'ü de koyuyoruz ki
   * frontend tarafında admin kontrolü yapılabilsin.
   */
  private async signToken(userId: number, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };
    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 hane
  }

  async register(dto: RegisterDto) {
    const { email, password, fullName } = dto;

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new BadRequestException('Bu e-posta zaten kayıtlı');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = this.generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    /**
     * Burada dto.role opsiyonel.
     * - Eğer body'den role gelmezse → USER
     * - Dev ortamında admin yaratmak için curl ile role: "ADMIN" gönderebiliriz.
     */
    const finalRole: UserRole = (dto as any).role ?? UserRole.USER;

    // ✅ birthYear yoksa ama birthDate geldiyse otomatik üretelim
    const computedBirthYear =
      (dto as any).birthYear ??
      ((dto as any).birthDate
        ? new Date((dto as any).birthDate).getFullYear()
        : null);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        isEmailVerified: false,
        emailVerificationToken: otp,
        emailVerificationExpiresAt: expiresAt,
        role: finalRole,

        // ✅ Mobil register payload alanları (DB’de alanlar varsa kaydolur)
        gender: (dto as any).gender ?? null,
        city: (dto as any).city ?? null,
        hometown: (dto as any).hometown ?? null,
        zodiacSign: (dto as any).zodiacSign ?? null,

        // DB’de birthDate DateTime ise:
        birthDate: (dto as any).birthDate
          ? new Date((dto as any).birthDate)
          : null,

        // DB’de birthYear Int ise:
        birthYear: computedBirthYear,
      },
    });

    // mail ile OTP gönder
    await this.mailService.sendEmailVerificationCode(email, otp);

    const accessToken = await this.signToken(user.id, user.email!, user.role);

    return {
      status: 'REGISTERED',
      message: 'Kayıt başarılı. Lütfen e-posta doğrulama kodunuzu girin.',
      // dev aşaması için kodu dönebilirsin, prod'da kaldır:
      debugCode: otp,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
      },
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const { email, code } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.emailVerificationToken) {
      throw new BadRequestException('Doğrulama kodu bulunamadı');
    }

    if (user.emailVerificationToken !== code) {
      throw new BadRequestException('Geçersiz doğrulama kodu');
    }

    if (
      user.emailVerificationExpiresAt &&
      user.emailVerificationExpiresAt < new Date()
    ) {
      throw new BadRequestException('Doğrulama kodunun süresi dolmuş');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    const accessToken = await this.signToken(
      updated.id,
      updated.email!,
      updated.role,
    );

    return {
      status: 'EMAIL_VERIFIED',
      accessToken,
      user: {
        id: updated.id,
        email: updated.email,
        isEmailVerified: updated.isEmailVerified,
        role: updated.role, // 🔥 burada da role döndürüyoruz
      },
    };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }

    // İstersen burada email verify zorunluluğunu ekleyebilirsin:
    // if (!user.isEmailVerified) {
    //   throw new UnauthorizedException('Lütfen önce e-posta adresinizi doğrulayın');
    // }

    const accessToken = await this.signToken(user.id, user.email!, user.role);

    return {
      status: 'LOGGED_IN',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isEmailVerified: user.isEmailVerified,
        role: user.role, // 🔥 frontend burada ADMIN mi diye bakacak
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Güvenlik için: kullanıcı yoksa bile aynı cevabı dön
    if (!user) {
      return {
        status: 'OK',
        message:
          'Eğer bu e-posta kayıtlıysa, şifre sıfırlama linki gönderilmiştir.',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 dakika

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      },
    });

    const baseUrl = process.env.WEB_APP_BASE_URL || 'https://example.com';
    const resetUrl = `${baseUrl.replace(
      /\/$/,
      '',
    )}/reset-password?token=${token}`;

    // mail gönder
    await this.mailService.sendPasswordResetCode(
      email,
      `Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:\n\n${resetUrl}\n\nBu link 10 dakika boyunca geçerlidir.`,
    );

    return {
      status: 'OK',
      message:
        'Şifre sıfırlama linki e-posta adresinize gönderildi (eğer kayıtlıysa).',
      // dev için:
      debugResetUrl: resetUrl,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { token, newPassword } = dto;

    const user = await this.prisma.user.findFirst({
      where: { passwordResetToken: token },
    });

    if (!user || !user.passwordResetToken) {
      throw new BadRequestException(
        'Geçersiz veya kullanılmış şifre sıfırlama linki',
      );
    }

    if (
      user.passwordResetExpiresAt &&
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new BadRequestException('Şifre sıfırlama linkinin süresi dolmuş');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return {
      status: 'PASSWORD_RESET',
      message: 'Şifreniz başarıyla güncellendi.',
    };
  }
}
