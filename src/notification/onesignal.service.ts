// src/notification/onesignal.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

type SendResult = {
  skipped?: boolean;
  reason?: string;
  dryRun?: boolean;
  env: string;
  mode: 'external' | 'subscription' | 'player' | 'segment';
  recipients: number;
  deviceIds: string[];
  data?: any;
};

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

  private baseHeaders() {
    return {
      Authorization: `Basic ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private guardCommon(
    ids: string[],
    mode: SendResult['mode'],
  ): SendResult | null {
    if (!this.enabled) {
      this.logger.warn('🚫 OneSignal disabled');
      return {
        skipped: true,
        reason: 'disabled',
        env: this.env,
        mode,
        recipients: 0,
        deviceIds: [],
      };
    }

    if (!this.appId || !this.apiKey) {
      this.logger.error('❌ OneSignal config missing');
      return {
        skipped: true,
        reason: 'config-missing',
        env: this.env,
        mode,
        recipients: 0,
        deviceIds: [],
      };
    }

    const cleaned = (ids ?? []).map(String).filter(Boolean);
    if (cleaned.length === 0) {
      this.logger.warn(`⚠️ OneSignal: recipient yok (${mode})`);
      return {
        skipped: true,
        reason: 'no-recipients',
        env: this.env,
        mode,
        recipients: 0,
        deviceIds: [],
      };
    }

    if (this.dryRun) {
      this.logger.log(
        `🧪 [DRY-RUN] OneSignal ${mode} → ${cleaned.length} hedef`,
      );
      return {
        skipped: true,
        dryRun: true,
        env: this.env,
        mode,
        recipients: cleaned.length,
        deviceIds: cleaned,
      };
    }

    return null;
  }

  /** ✅ 1) EN SAĞLAM: External User ID ile gönder (mobile: OneSignal.login("4")) */
  async sendToExternalUserIds(
    externalUserIds: string[],
    title: string,
    body: string,
  ) {
    if (!this.enabled || !this.appId || !this.apiKey) {
      return { skipped: true };
    }

    if (!externalUserIds.length) {
      return { skipped: true, reason: 'no-recipients' };
    }

    const res = await axios.post(
      this.url,
      {
        app_id: this.appId,
        include_external_user_ids: externalUserIds, // 🔥 ASIL OLAY
        headings: { en: title },
        contents: { en: body },
      },
      {
        headers: {
          Authorization: `Basic ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      ...res.data,
      externalUserIds,
      recipients: externalUserIds.length,
    };
  }

  /** ✅ 2) Subscription ID ile gönder (panelde gördüğün "Subscription ID") */
  async sendToSubscriptionIds(
    subscriptionIds: string[],
    title: string,
    body: string,
  ): Promise<SendResult> {
    const ids = (subscriptionIds ?? []).map(String).filter(Boolean);
    const guard = this.guardCommon(ids, 'subscription');
    if (guard) return guard;

    try {
      const res = await axios.post(
        this.url,
        {
          app_id: this.appId,
          include_subscription_ids: ids,
          headings: { en: title },
          contents: { en: body },
        },
        { headers: this.baseHeaders() },
      );

      this.logger.log(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `📨 OneSignal sendToSubscriptionIds env=${this.env} status=${res.status} id=${res.data?.id} targets=${ids.length}`,
      );

      return {
        env: this.env,
        mode: 'subscription',
        recipients: ids.length,
        deviceIds: ids,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: res.data,
      };
    } catch (err: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const data = err?.response?.data ?? err?.message ?? 'Unknown error';
      this.logger.error(
        `❌ OneSignal sendToSubscriptionIds error: ${JSON.stringify(data)}`,
      );
      throw err;
    }
  }

  /** ✅ 3) Legacy player id (eski sistem) — sende şu an büyük ihtimal yanlış */
  async sendToPlayerIds(
    playerIds: string[],
    title: string,
    body: string,
  ): Promise<SendResult> {
    const ids = (playerIds ?? []).map(String).filter(Boolean);
    const guard = this.guardCommon(ids, 'player');
    if (guard) return guard;

    try {
      const res = await axios.post(
        this.url,
        {
          app_id: this.appId,

          include_external_user_ids: ids,
          headings: { en: title },
          contents: { en: body },
        },
        { headers: this.baseHeaders() },
      );

      this.logger.log(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `📨 OneSignal sendToPlayerIds env=${this.env} status=${res.status} id=${res.data?.id} targets=${ids.length}`,
      );

      return {
        env: this.env,
        mode: 'player',
        recipients: ids.length,
        deviceIds: ids,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: res.data,
      };
    } catch (err: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const data = err?.response?.data ?? err?.message ?? 'Unknown error';
      this.logger.error(
        `❌ OneSignal sendToPlayerIds error: ${JSON.stringify(data)}`,
      );
      throw err;
    }
  }

  /** (Eski) Segment'e gönderim — kalsın */
  async sendToAll(title: string, body: string): Promise<SendResult> {
    if (!this.enabled) {
      return {
        skipped: true,
        reason: 'disabled',
        env: this.env,
        mode: 'segment',
        recipients: 0,
        deviceIds: [],
      };
    }
    if (!this.appId || !this.apiKey) {
      return {
        skipped: true,
        reason: 'config-missing',
        env: this.env,
        mode: 'segment',
        recipients: 0,
        deviceIds: [],
      };
    }
    if (this.dryRun) {
      return {
        skipped: true,
        dryRun: true,
        env: this.env,
        mode: 'segment',
        recipients: 0,
        deviceIds: [],
      };
    }

    try {
      const res = await axios.post(
        this.url,
        {
          app_id: this.appId,
          included_segments: ['Subscribed Users'],
          contents: { en: body },
          headings: { en: title },
        },
        { headers: this.baseHeaders() },
      );

      this.logger.log(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `📨 OneSignal sendToAll env=${this.env} status=${res.status} id=${res.data?.id}`,
      );

      return {
        env: this.env,
        mode: 'segment',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        recipients: res.data?.recipients ?? 0,
        deviceIds: [],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: res.data,
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
}
