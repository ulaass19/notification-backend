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

  async sendToExternalUserIds(
    externalIds: string[],
    title: string,
    body: string,
  ) {
    const g = this.guardBase();
    if (!g.ok)
      return {
        skipped: true,
        reason: g.reason,
        recipients: 0,
        externalIds: [],
      };

    const ids = (externalIds ?? [])
      .map(String)
      .map((x) => x.trim())
      .filter(Boolean);

    if (!ids.length) {
      return {
        skipped: true,
        reason: 'no-recipients',
        recipients: 0,
        externalIds: [],
      };
    }

    const res = await axios.post<OneSignalResponse>(
      this.url,
      {
        app_id: this.appId,
        include_aliases: { external_id: ids },
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

    const realRecipients = res.data?.recipients ?? 0;

    this.logger.log(
      `📨 OneSignal external_id (env=${this.env}) status=${res.status} id=${res.data?.id ?? ''} recipients=${realRecipients}`,
    );

    return { ...res.data, externalIds: ids, recipients: realRecipients };
  }

  async sendToSubscriptionIds(
    subscriptionIds: string[],
    title: string,
    body: string,
  ) {
    const g = this.guardBase();
    if (!g.ok)
      return {
        skipped: true,
        reason: g.reason,
        recipients: 0,
        subscriptionIds: [],
      };

    const ids = (subscriptionIds ?? [])
      .map(String)
      .map((x) => x.trim())
      .filter(Boolean);

    if (!ids.length) {
      return {
        skipped: true,
        reason: 'no-recipients',
        recipients: 0,
        subscriptionIds: [],
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

    const realRecipients = res.data?.recipients ?? 0;

    this.logger.log(
      `📨 OneSignal subscriptionIds (env=${this.env}) status=${res.status} id=${res.data?.id ?? ''} recipients=${realRecipients}`,
    );

    return { ...res.data, subscriptionIds: ids, recipients: realRecipients };
  }
}
