import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WaitlistService } from '../waitlist/waitlist.service';

const ABANDONED_TTL_MIN = 20;
const ABANDONED_INTERVAL_MS = 5 * 60_000;
const REMINDER_INTERVAL_MS = 60 * 60_000;

/**
 * Lightweight in-process scheduler (single-instance MVP):
 *  - abandoned-order sweep: PENDING orders past TTL -> CANCELED + stock restored
 *  - reminder sweep: events ~24h out -> notify paid attendees (once)
 * For multi-instance, move these to BullMQ repeatable jobs. Both are also
 * exposed as manual admin triggers (testing / ops).
 */
@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private readonly timers: NodeJS.Timeout[] = [];
  private readonly running = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    private readonly waitlist: WaitlistService,
  ) {}

  onModuleInit(): void {
    this.timers.push(
      setInterval(
        () => this.safe('abandoned', () => this.sweepAbandonedOrders()),
        ABANDONED_INTERVAL_MS,
      ),
    );
    this.timers.push(
      setInterval(
        () => this.safe('reminders', () => this.sweepReminders()),
        REMINDER_INTERVAL_MS,
      ),
    );
  }

  onModuleDestroy(): void {
    this.timers.forEach((t) => clearInterval(t));
  }

  private async safe(name: string, fn: () => Promise<unknown>): Promise<void> {
    if (this.running.has(name)) return; // no overlap
    this.running.add(name);
    try {
      await fn();
    } catch (e) {
      this.logger.error(`${name} sweep failed: ${(e as Error).message}`);
    } finally {
      this.running.delete(name);
    }
  }

  /** PENDING orders older than ttlMinutes -> CANCELED, reserved stock restored. */
  async sweepAbandonedOrders(ttlMinutes = ABANDONED_TTL_MIN) {
    const cutoff = new Date(Date.now() - ttlMinutes * 60_000);
    const stale = await this.prisma.order.findMany({
      where: { status: 'PENDING', createdAt: { lt: cutoff } },
      include: { items: true },
    });

    let canceled = 0;
    const freed: { tierId: string; qty: number }[] = [];
    for (const order of stale) {
      const didCancel = await this.prisma.$transaction(async (tx) => {
        const gate = await tx.order.updateMany({
          where: { id: order.id, status: 'PENDING' },
          data: { status: 'CANCELED', canceledAt: new Date() },
        });
        if (gate.count === 0) return false; // someone paid it in the meantime
        for (const item of order.items) {
          await tx.ticketTier.update({
            where: { id: item.tierId },
            data: { sold: { decrement: item.qty } },
          });
        }
        return true;
      });
      if (didCancel) {
        canceled++;
        for (const item of order.items) freed.push({ tierId: item.tierId, qty: item.qty });
      }
    }
    // notify waitlist after commits (external mail/push, kept out of the tx)
    for (const f of freed) {
      await this.waitlist.notifyNext(f.tierId, f.qty).catch(() => undefined);
    }
    if (canceled) {
      this.logger.log(
        `Abandoned-order sweep: canceled ${canceled} order(s), stock restored`,
      );
    }
    return { scanned: stale.length, canceled };
  }

  /** Events starting in ~24h: remind paid attendees once (reminderSentAt guard). */
  async sweepReminders() {
    const now = Date.now();
    const events = await this.prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        reminderSentAt: null,
        startsAt: { gte: new Date(now + 23 * 3_600_000), lte: new Date(now + 25 * 3_600_000) },
      },
      select: { id: true, title: true, slug: true, startsAt: true },
    });

    let notified = 0;
    for (const ev of events) {
      const orders = await this.prisma.order.findMany({
        where: { eventId: ev.id, status: 'PAID' },
        select: { email: true, fullName: true, userId: true },
      });
      const whenText = ev.startsAt.toLocaleString('tr-TR');
      const link = `${this.config.get<string>('WEB_URL') ?? ''}/events/${ev.slug}`;
      const seen = new Set<string>();
      const userIds: string[] = [];
      for (const o of orders) {
        if (seen.has(o.email)) continue;
        seen.add(o.email);
        await this.mail
          .sendEventReminder(o.email, o.fullName, ev.title, whenText, link)
          .catch(() => undefined);
        if (o.userId) userIds.push(o.userId);
        notified++;
      }
      if (userIds.length) {
        await this.notifications
          .sendToUsers(userIds, `Yaklaşıyor: ${ev.title}`, `${whenText} — biletin hazır olsun`, {
            url: link,
          })
          .catch(() => undefined);
      }
      await this.prisma.event.update({
        where: { id: ev.id },
        data: { reminderSentAt: new Date() },
      });
    }
    if (notified) {
      this.logger.log(`Reminder sweep: ${events.length} event(s), ${notified} attendee mail(s)`);
    }
    return { events: events.length, notified };
  }
}
