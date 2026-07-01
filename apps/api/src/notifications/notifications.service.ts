import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { PrismaService } from '../prisma/prisma.service';

export interface PushOptions {
  url?: string;
  data?: Record<string, unknown>;
  segment?: string;
}

export interface InAppPayload {
  type: 'order' | 'waitlist' | 'event' | 'system';
  title: string;
  body?: string;
  href?: string;
}

/**
 * OneSignal push notifications (REST v1).
 * - broadcast(): toplu push (tüm aboneler / segment).
 * - sendToUsers(): hedefli — client SDK OneSignal external id'sini Luca user.id
 *   olarak set etmeli (OneSignal.login(userId)).
 * Yapılandırılmamışsa (env yok) sessizce skip eder; uygulamayı düşürmez.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly endpoint = 'https://onesignal.com/api/v1/notifications';

  constructor(
    private readonly settings: SettingsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Hedefli bildirim: uygulama-içi (DB inbox) kaydı + push (OneSignal) birlikte.
   * Kanca noktaları (bilet onayı, bekleme, iptal) bunu çağırır.
   */
  async notifyUsers(userIds: string[], p: InAppPayload): Promise<void> {
    const ids = [...new Set(userIds.filter(Boolean))];
    if (ids.length === 0) return;
    // in-app
    await this.prisma.notification.createMany({
      data: ids.map((userId) => ({
        userId,
        type: p.type,
        title: p.title,
        body: p.body ?? null,
        href: p.href ?? null,
      })),
    });
    // push (yapılandırılmamışsa sessizce skip)
    await this.sendToUsers(ids, p.title, p.body ?? '', { url: p.href }).catch((e) =>
      this.logger.warn(`push skipped: ${(e as Error).message}`),
    );
  }

  // ——— inbox (uygulama-içi bildirim merkezi) ———
  listForUser(userId: string, take = 30) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  async markRead(userId: string, ids?: string[]): Promise<{ ok: true }> {
    await this.prisma.notification.updateMany({
      where: { userId, read: false, ...(ids?.length ? { id: { in: ids } } : {}) },
      data: { read: true },
    });
    return { ok: true };
  }

  private async creds() {
    return {
      appId: await this.settings.get('push.onesignal.appId'),
      apiKey: await this.settings.get('push.onesignal.apiKey'),
    };
  }

  async isConfigured(): Promise<boolean> {
    const { appId, apiKey } = await this.creds();
    return Boolean(appId && apiKey);
  }

  /** Public — frontend web-push SDK'sını başlatmak için (appId gizli değil; apiKey verilmez). */
  async publicConfig(): Promise<{ enabled: boolean; appId: string }> {
    try {
      const appId = await this.settings.get('push.onesignal.appId');
      return { enabled: Boolean(appId), appId: appId || '' };
    } catch {
      return { enabled: false, appId: '' };
    }
  }

  broadcast(title: string, message: string, opts: PushOptions = {}) {
    return this.send({
      included_segments: [opts.segment ?? 'Subscribed Users'],
      headings: { en: title },
      contents: { en: message },
      url: opts.url,
      data: opts.data,
    });
  }

  /**
   * Detaylı gönderim: hedef (herkes / belirli etkinlik katılımcıları) +
   * kanal (uygulama-içi çan / OneSignal push). Uygulama-içi anahtar gerektirmez.
   */
  async dispatch(o: {
    title: string;
    message: string;
    url?: string;
    target: 'all' | 'event';
    eventId?: string;
    inapp: boolean;
    push: boolean;
  }): Promise<{ recipients: number; inapp: number; push: unknown }> {
    // hedef kullanıcıları çöz
    let userIds: string[] = [];
    if (o.target === 'event' && o.eventId) {
      const rows = await this.prisma.order.findMany({
        where: { eventId: o.eventId, status: 'PAID', userId: { not: null } },
        select: { userId: true },
        distinct: ['userId'],
      });
      userIds = rows.map((r) => r.userId!).filter(Boolean);
    } else {
      const rows = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      userIds = rows.map((r) => r.id);
    }

    // uygulama-içi (çan) — anahtar gerekmez
    let inapp = 0;
    if (o.inapp && userIds.length) {
      await this.prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          type: 'admin',
          title: o.title,
          body: o.message || null,
          href: o.url || null,
        })),
      });
      inapp = userIds.length;
    }

    // push
    let push: unknown = { skipped: true, reason: 'push kapalı' };
    if (o.push) {
      push =
        o.target === 'all'
          ? await this.broadcast(o.title, o.message, { url: o.url })
          : await this.sendToUsers(userIds, o.title, o.message, { url: o.url });
    }

    return { recipients: userIds.length, inapp, push };
  }

  sendToUsers(
    externalUserIds: string[],
    title: string,
    message: string,
    opts: PushOptions = {},
  ) {
    const ids = externalUserIds.filter(Boolean);
    if (ids.length === 0) {
      return Promise.resolve({ skipped: true, reason: 'no recipients' });
    }
    return this.send({
      include_external_user_ids: ids,
      headings: { en: title },
      contents: { en: message },
      url: opts.url,
      data: opts.data,
    });
  }

  private async send(payload: Record<string, unknown>) {
    const { appId, apiKey } = await this.creds();
    if (!appId || !apiKey) {
      this.logger.warn('OneSignal not configured — push skipped');
      return { skipped: true, reason: 'not configured' };
    }

    const body = JSON.stringify(
      Object.fromEntries(
        Object.entries({ app_id: appId, ...payload }).filter(
          ([, v]) => v !== undefined,
        ),
      ),
    );

    let res: Response;
    try {
      res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Basic ${apiKey}`,
        },
        body,
      });
    } catch (e) {
      this.logger.error(`OneSignal request failed: ${(e as Error).message}`);
      throw new ServiceUnavailableException('Push provider unreachable');
    }

    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      recipients?: number;
      errors?: unknown;
    };
    if (!res.ok) {
      this.logger.error(`OneSignal error ${res.status}: ${JSON.stringify(json)}`);
      throw new ServiceUnavailableException('Push provider error');
    }
    return { ok: true, id: json.id, recipients: json.recipients ?? 0 };
  }
}
