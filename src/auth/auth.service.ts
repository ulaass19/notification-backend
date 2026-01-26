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
import { UserRole, ZodiacSign, Gender } from '@prisma/client'; // ✅ ENUM'lar

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

  // ✅ Prisma enum güvenli normalize (string gelirse bile patlamasın)
  private normalizeZodiac(input: any): ZodiacSign | null {
    if (!input) return null;
    const val = String(input).trim();

    // DTO zaten Prisma enum ise direkt döner
    if ((Object.values(ZodiacSign) as string[]).includes(val)) {
      return val as ZodiacSign;
    }

    // TR -> Prisma enum map (Prisma enum isimlerin İngilizce ise burayı uyarlarsın)
    const map: Record<string, ZodiacSign> = {
      Koç: 'ARIES' as ZodiacSign,
      Boğa: 'TAURUS' as ZodiacSign,
      İkizler: 'GEMINI' as ZodiacSign,
      Yengeç: 'CANCER' as ZodiacSign,
      Aslan: 'LEO' as ZodiacSign,
      Başak: 'VIRGO' as ZodiacSign,
      Terazi: 'LIBRA' as ZodiacSign,
      Akrep: 'SCORPIO' as ZodiacSign,
      Yay: 'SAGITTARIUS' as ZodiacSign,
      Oğlak: 'CAPRICORN' as ZodiacSign,
      Kova: 'AQUARIUS' as ZodiacSign,
      Balık: 'PISCES' as ZodiacSign,
    };

    return map[val] ?? null;
  }

  private normalizeGender(input: any): Gender | null {
    if (!input) return null;
    const val = String(input).trim();
    if ((Object.values(Gender) as string[]).includes(val)) {
      return val as Gender;
    }
    // Eğer mobile "FEMALE/MALE/PREFER_NOT_TO_SAY" yolluyorsa ve Prisma farklıysa mapleyebilirsin.
    return null;
  }

  async register(dto: RegisterDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const {
      email,
      password,
      fullName,
      gender,
      city,
      hometown,
      zodiacSign,
      birthYear,
      birthDate,
      role,
    } = dto as any;

    const existing = await this.prisma.user.findUnique({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: { email },
    });
    if (existing) {
      throw new BadRequestException('Bu e-posta zaten kayıtlı');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const otp = this.generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const finalRole: UserRole = role ?? UserRole.USER;

    // birthDate -> Date objesine çevir (YYYY-MM-DD)
    let birthDateDb: Date | null = null;
    if (birthDate) {
      const d = new Date(birthDate);
      if (!isNaN(d.getTime())) birthDateDb = d;
    }

    // birthYear yoksa birthDate'ten üret
    const computedBirthYear =
      typeof birthYear === 'number'
        ? birthYear
        : birthDateDb
          ? birthDateDb.getFullYear()
          : null;

    // ✅ ENUM normalize (string gelirse bile Prisma tipine çevir)
    const genderDb = this.normalizeGender(gender);
    const zodiacDb = this.normalizeZodiac(zodiacSign);

    const user = await this.prisma.user.create({
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        email,
        passwordHash,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        fullName,
        isEmailVerified: false,
        emailVerificationToken: otp,
        emailVerificationExpiresAt: expiresAt,
        role: finalRole,

        // ✅ profil alanları (Prisma User modelinde varsa)
        gender: genderDb,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        city: city ?? null,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        hometown: hometown ?? null,
        zodiacSign: zodiacDb,
        birthYear: computedBirthYear,

        // Prisma'da birthDate alanın yoksa bunu SİL:
        // birthDate: birthDateDb,
      },
    });

    await this.mailService.sendEmailVerificationCode(email, otp);

    const accessToken = await this.signToken(user.id, user.email!, user.role);

    return {
      status: 'REGISTERED',
      message: 'Kayıt başarılı. Lütfen e-posta doğrulama kodunuzu girin.',
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
        role: updated.role,
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

    const accessToken = await this.signToken(user.id, user.email!, user.role);

    return {
      status: 'LOGGED_IN',
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        status: 'OK',
        message:
          'Eğer bu e-posta kayıtlıysa, şifre sıfırlama linki gönderilmiştir.',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      },
    });

    const baseUrl = process.env.WEB_APP_BASE_URL || 'https://example.com';
    const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}`;

    await this.mailService.sendPasswordResetCode(
      email,
      `Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:\n\n${resetUrl}\n\nBu link 10 dakika boyunca geçerlidir.`,
    );

    return {
      status: 'OK',
      message:
        'Şifre sıfırlama linki e-posta adresinize gönderildi (eğer kayıtlıysa).',
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
