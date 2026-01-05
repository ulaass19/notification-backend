// src/notification/onesignal.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OneSignalService {
  private readonly logger = new Logger(OneSignalService.name);

  private readonly appId = process.env.ONESIGNAL_APP_ID;
  private readonly apiKey = process.env.ONESIGNAL_REST_API_KEY;

  private readonly enabled =
    (process.env.ONESIGNAL_ENABLED ?? 'true').toLowerCase() === 'true';

  private readonly dryRun =
    (process.env.ONESIGNAL_DRY_RUN ?? 'false').toLowerCase() === 'true';

  private readonly env = process.env.NODE_ENV ?? 'development';

  // ✅ doğru endpoint
  private readonly url = 'https://onesignal.com/api/v1/notifications';

  constructor() {
    if (!this.appId || !this.apiKey) {
      this.logger.error(
        '❌ OneSignal config eksik! .env dosyasını kontrol et.',
      );
    }
    if (!this.enabled) {
      this.logger.warn(
        '⚠️ OneSignal devre dışı (ONESIGNAL_ENABLED=false), tüm gönderimler skip edilecek.',
      );
    }
    if (this.dryRun) {
      this.logger.warn(
        '🧪 OneSignal DRY-RUN modunda (ONESIGNAL_DRY_RUN=true), gerçek HTTP isteği atılmayacak.',
      );
    }
  }

  getStatus() {
    const hasConfig = Boolean(this.appId && this.apiKey);

    let status: 'OK' | 'DISABLED' | 'DRY_RUN' | 'CONFIG_MISSING';
    if (!hasConfig) status = 'CONFIG_MISSING';
    else if (!this.enabled) status = 'DISABLED';
    else if (this.dryRun) status = 'DRY_RUN';
    else status = 'OK';

    return {
      enabled: this.enabled,
      dryRun: this.dryRun,
      hasConfig,
      env: this.env,
      status,
    };
  }

  /** (Eski) Segment'e gönderim — kalsın dursun */
  async sendToAll(title: string, body: string) {
    if (!this.enabled) return { skipped: true, reason: 'disabled' };
    if (!this.appId || !this.apiKey)
      return { skipped: true, reason: 'config-missing' };
    if (this.dryRun) return { skipped: true, dryRun: true };

    try {
      const res = await axios.post(
        this.url,
        {
          app_id: this.appId,
          included_segments: ['Subscribed Users'],
          contents: { en: body },
          headings: { en: title },
        },
        {
          headers: {
            Authorization: `Basic ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `📨 OneSignal sentToAll (env=${this.env}) status=${res.status} id=${res.data?.id}`,
      );

      // ✅ standartlaştır
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...res.data,
        deviceIds: [],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        recipients: res.data?.recipients ?? 0,
      };
    } catch (err: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const data = err?.response?.data ?? err?.message ?? 'Unknown error';
      this.logger.error(
        `❌ OneSignal sendToAll error: ${JSON.stringify(data)}`,
      );
      throw err;
    }
  }

  /** ✅ ASIL İHTİYACIMIZ: deviceId(playerId) listesine gönder */
  async sendToDeviceIds(deviceIds: string[], title: string, body: string) {
    if (!this.enabled) {
      this.logger.warn('🚫 OneSignal disabled');
      return {
        skipped: true,
        reason: 'disabled',
        deviceIds: [],
        recipients: 0,
      };
    }

    if (!this.appId || !this.apiKey) {
      this.logger.error('❌ OneSignal config missing');
      return {
        skipped: true,
        reason: 'config-missing',
        deviceIds: [],
        recipients: 0,
      };
    }

    const ids = (deviceIds ?? []).filter(Boolean);
    if (ids.length === 0) {
      this.logger.warn('⚠️ sendToDeviceIds: recipient yok (deviceIds boş)');
      return {
        skipped: true,
        reason: 'no-recipients',
        deviceIds: [],
        recipients: 0,
      };
    }

    if (this.dryRun) {
      this.logger.log(`🧪 [DRY-RUN] sendToDeviceIds → ${ids.length} devices`);
      return {
        skipped: true,
        dryRun: true,
        count: ids.length,
        deviceIds: ids,
        recipients: ids.length,
      };
    }

    try {
      const res = await axios.post(
        this.url,
        {
          app_id: this.appId,
          include_player_ids: ids, // 🔥 KRİTİK
          contents: { en: body },
          headings: { en: title },
        },
        {
          headers: {
            Authorization: `Basic ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `📨 OneSignal sentToDeviceIds (env=${this.env}) status=${res.status} id=${res.data?.id} recipients=${ids.length}`,
      );

      // ✅ KRİTİK: deviceIds'i response'a koyuyoruz ki NotificationService inbox yazsın
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...res.data,
        deviceIds: ids,
        recipients: ids.length,
      };
    } catch (err: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const data = err?.response?.data ?? err?.message ?? 'Unknown error';
      this.logger.error(
        `❌ OneSignal sendToDeviceIds error: ${JSON.stringify(data)}`,
      );
      throw err;
    }
  }
}
