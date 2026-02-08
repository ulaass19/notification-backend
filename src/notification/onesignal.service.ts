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

  private readonly url = 'https://onesignal.com/api/v1/notifications';

  constructor() {
    if (!this.appId || !this.apiKey) {
      this.logger.error('❌ OneSignal config eksik! .env kontrol et.');
    }
    if (!this.enabled) {
      this.logger.warn('⚠️ OneSignal disabled (ONESIGNAL_ENABLED=false)');
    }
    if (this.dryRun) {
      this.logger.warn('🧪 OneSignal DRY_RUN (ONESIGNAL_DRY_RUN=true)');
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

  /** (İstersen kalsın) Segment'e gönderim */
  async sendToAll(title: string, body: string) {
    if (!this.enabled) return { skipped: true, reason: 'disabled' };
    if (!this.appId || !this.apiKey)
      return { skipped: true, reason: 'config-missing' };
    if (this.dryRun) return { skipped: true, dryRun: true };

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
      `📨 OneSignal sentToAll (env=${this.env}) status=${res.status} id=${res.data?.id ?? ''}`,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      ...res.data,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      recipients: res.data?.recipients ?? 0,
    };
  }

  /**
   * ✅ KRİTİK FIX:
   * Mobilde aldığın değer PLAYER ID değil, "pushSubscriptionId".
   * O yüzden OneSignal API'de include_player_ids yerine include_subscription_ids kullanılmalı.
   *
   * Senin DB'de user.deviceId alanında tuttuğun değer = subscriptionId
   */
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

    const ids = (deviceIds ?? []).filter(
      (x) => typeof x === 'string' && x.length > 0,
    );

    if (ids.length === 0) {
      this.logger.warn('⚠️ sendToDeviceIds: recipient yok (ids boş)');
      return {
        skipped: true,
        reason: 'no-recipients',
        deviceIds: [],
        recipients: 0,
      };
    }

    if (this.dryRun) {
      this.logger.log(
        `🧪 [DRY-RUN] sendToDeviceIds → ${ids.length} subscriptions`,
      );
      return {
        skipped: true,
        dryRun: true,
        deviceIds: ids,
        recipients: ids.length,
      };
    }

    const res = await axios.post(
      this.url,
      {
        app_id: this.appId,

        // 🔥 FIX: subscription id gönderiyoruz
        include_subscription_ids: ids,

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
      `📨 OneSignal sentToDeviceIds(include_subscription_ids) (env=${this.env}) status=${res.status} id=${res.data?.id ?? ''} recipients=${ids.length}`,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      ...res.data,
      deviceIds: ids,
      recipients: ids.length,
    };
  }
}
