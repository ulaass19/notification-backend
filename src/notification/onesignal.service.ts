import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

type OneSignalResponse = any;

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
    if (!this.enabled)
      this.logger.warn('⚠️ OneSignal disabled (ONESIGNAL_ENABLED=false)');
    if (this.dryRun)
      this.logger.warn('🧪 OneSignal DRY_RUN (ONESIGNAL_DRY_RUN=true)');
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

  private guardBase() {
    if (!this.enabled) return { ok: false, reason: 'disabled' as const };
    if (!this.appId || !this.apiKey)
      return { ok: false, reason: 'config-missing' as const };
    if (this.dryRun) return { ok: false, reason: 'dry-run' as const };
    return { ok: true as const };
  }

  /** ✅ Segment'e gönderim (istersen kalsın) */
  async sendToAll(title: string, body: string) {
    const g = this.guardBase();
    if (!g.ok) return { skipped: true, reason: g.reason };

    const res = await axios.post(
      this.url,
      {
        app_id: this.appId,
        included_segments: ['Subscribed Users'],
        target_channel: 'push',
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
      `📨 OneSignal sendToAll (env=${this.env}) status=${res.status} id=${res.data?.id ?? ''} recipients=${res.data?.recipients ?? '?'}`,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return res.data;
  }

  /**
   * ✅ DOĞRU YOL: External User ID ile gönder
   * - Mobilde OneSignal.login(userId) çağrılmalı
   * - DB'de deviceId tutmak zorunda değilsin
   */
  async sendToExternalUserIds(
    externalIds: string[],
    title: string,
    body: string,
  ) {
    if (!this.enabled)
      return {
        skipped: true,
        reason: 'disabled',
        recipients: 0,
        externalIds: [],
      };
    if (!this.appId || !this.apiKey)
      return {
        skipped: true,
        reason: 'config-missing',
        recipients: 0,
        externalIds: [],
      };

    const ids = (externalIds ?? [])
      .map(String)
      .map((x) => x.trim())
      .filter(Boolean);

    if (!ids.length) {
      this.logger.warn('⚠️ sendToExternalUserIds: recipient yok (ids boş)');
      return {
        skipped: true,
        reason: 'no-recipients',
        recipients: 0,
        externalIds: [],
      };
    }

    if (this.dryRun) {
      this.logger.log(
        `🧪 [DRY-RUN] sendToExternalUserIds → ${ids.length} external_ids`,
      );
      return {
        skipped: true,
        dryRun: true,
        recipients: ids.length,
        externalIds: ids,
      };
    }

    const res = await axios.post<OneSignalResponse>(
      this.url,
      {
        app_id: this.appId,

        // ✅ External ID hedefleme (User model)
        include_aliases: { external_id: ids },

        // ✅ push'a zorla (multi-channel varsa şart)
        target_channel: 'push',

        contents: { en: body },
        headings: { en: title },
        // (opsiyonel) test için:
        // priority: 10,
      },
      {
        headers: {
          Authorization: `Basic ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // 🔥 KRİTİK: gerçek recipients değerini logla
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const realRecipients = res.data?.recipients ?? 0;

    this.logger.log(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      `📨 OneSignal sendToExternalUserIds (env=${this.env}) status=${res.status} id=${res.data?.id ?? ''} recipients=${realRecipients}`,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return
    return { ...res.data, externalIds: ids, recipients: realRecipients };
  }

  /**
   * (İstersen kalsın) Subscription ID ile gönderim
   * NOT: Bunu kullanacaksan DB’de gerçekten subscription id tuttuğundan emin ol.
   */
  async sendToSubscriptionIds(
    subscriptionIds: string[],
    title: string,
    body: string,
  ) {
    if (!this.enabled)
      return {
        skipped: true,
        reason: 'disabled',
        recipients: 0,
        subscriptionIds: [],
      };
    if (!this.appId || !this.apiKey)
      return {
        skipped: true,
        reason: 'config-missing',
        recipients: 0,
        subscriptionIds: [],
      };

    const ids = (subscriptionIds ?? [])
      .map(String)
      .map((x) => x.trim())
      .filter(Boolean);

    if (!ids.length) {
      this.logger.warn('⚠️ sendToSubscriptionIds: recipient yok (ids boş)');
      return {
        skipped: true,
        reason: 'no-recipients',
        recipients: 0,
        subscriptionIds: [],
      };
    }

    if (this.dryRun) {
      this.logger.log(
        `🧪 [DRY-RUN] sendToSubscriptionIds → ${ids.length} subscriptions`,
      );
      return {
        skipped: true,
        dryRun: true,
        recipients: ids.length,
        subscriptionIds: ids,
      };
    }

    const res = await axios.post(
      this.url,
      {
        app_id: this.appId,
        include_subscription_ids: ids,
        target_channel: 'push',
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const realRecipients = res.data?.recipients ?? 0;
    this.logger.log(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      `📨 OneSignal sendToSubscriptionIds (env=${this.env}) status=${res.status} id=${res.data?.id ?? ''} recipients=${realRecipients}`,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
    return { ...res.data, subscriptionIds: ids, recipients: realRecipients };
  }
}
