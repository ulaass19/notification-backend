import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, text: string) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.logger.warn(
        `SMTP_USER veya SMTP_PASS tanımlı değil, mail gönderilmiyor. To: ${to}, Subject: ${subject}`,
      );
      return;
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await this.transporter.sendMail({
      from,
      to,
      subject,
      text,
    });
  }

  async sendEmailVerificationCode(to: string, code: string) {
    const subject = 'E-posta Doğrulama Kodunuz';
    const text = `Merhaba,\n\nE-posta doğrulama kodunuz: ${code}\n\nBu kod 10 dakika boyunca geçerlidir.`;
    await this.sendMail(to, subject, text);
  }

  async sendPasswordResetCode(to: string, code: string) {
    const subject = 'Şifre Sıfırlama Kodunuz';
    const text = `Merhaba,\n\nŞifre sıfırlama kodunuz: ${code}\n\nBu kod 10 dakika boyunca geçerlidir.`;
    await this.sendMail(to, subject, text);
  }
}
