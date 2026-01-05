// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Basit health / hello endpoint'in aynen kalsın
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Sunucu saati & timezone endpoint'i
   *
   * GET /time
   *
   * Frontend (DailySpark admin paneli) bunu çağırıp:
   * - Sunucunun şu anki zamanını (ISO string olarak)
   * - Sunucunun timezone bilgisini
   * alıyor.
   *
   * Böylece:
   * - "Planlı gönder" ekranında, cihaz saati ile sunucu saati arasında
   *   drift var mı görebiliyoruz.
   * - Kullanıcıya "Cihaz saat dilimin şu, sunucu şu, arada X dk fark var"
   *   diye uyarı gösterebiliyoruz.
   */
  @Get('time')
  getServerTime() {
    const now = new Date();

    let tz: string | undefined;
    try {
      // Node tarafında da çoğu ortamda Intl mevcut oluyor
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      // bir şey bulamazsak boş geçeriz
    }

    return {
      now: now.toISOString(), // Sunucu zamanı (UTC ISO string)
      tz: process.env.TZ || tz || 'unknown', // Sunucu timezone'u (env.TZ varsa onu, yoksa Intl'den)
    };
  }
}
