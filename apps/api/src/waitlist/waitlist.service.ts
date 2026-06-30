import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JoinWaitlistDto } from './dto/waitlist.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Join the waitlist for a tier — only allowed when that tier is sold out. */
  async join(slug: string, dto: JoinWaitlistDto, userId?: string) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: { tickets: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    const tier = event.tickets.find((t) => t.id === dto.tierId);
    if (!tier) throw new BadRequestException('TIER_NOT_FOUND');
    if (tier.sold < tier.capacity) {
      throw new ConflictException('NOT_SOLD_OUT'); // just book it
    }

    const existing = await this.prisma.waitlistEntry.findFirst({
      where: { tierId: tier.id, email: dto.email, status: 'WAITING' },
    });
    if (existing) return existing; // idempotent

    return this.prisma.waitlistEntry.create({
      data: {
        eventId: event.id,
        tierId: tier.id,
        userId: userId ?? null,
        email: dto.email,
        fullName: dto.fullName,
        phone: dto.phone,
      },
    });
  }

  listMine(user: CurrentUserPayload) {
    return this.prisma.waitlistEntry.findMany({
      where: { OR: [{ userId: user.sub }, { email: user.email }] },
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { title: true, slug: true, startsAt: true } },
        tier: { select: { name: true } },
      },
    });
  }

  async leave(user: CurrentUserPayload, id: string) {
    await this.prisma.waitlistEntry.updateMany({
      where: { id, OR: [{ userId: user.sub }, { email: user.email }] },
      data: { status: 'CANCELED' },
    });
    return { ok: true };
  }

  listForEvent(eventId: string) {
    return this.prisma.waitlistEntry.findMany({
      where: { eventId, status: { in: ['WAITING', 'NOTIFIED'] } },
      orderBy: { createdAt: 'asc' },
      include: { tier: { select: { name: true } } },
    });
  }

  /**
   * Stock freed for a tier → notify the next `count` WAITING entries (FIFO).
   * Call AFTER the stock-restore transaction commits (does external mail/push).
   */
  async notifyNext(tierId: string, count: number) {
    if (count <= 0) return 0;
    const next = await this.prisma.waitlistEntry.findMany({
      where: { tierId, status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
      take: count,
      include: { event: { select: { title: true, slug: true } } },
    });
    for (const e of next) {
      await this.prisma.waitlistEntry.update({
        where: { id: e.id },
        data: { status: 'NOTIFIED', notifiedAt: new Date() },
      });
      const link = `${this.config.get<string>('WEB_URL') ?? ''}/events/${e.event.slug}`;
      await this.mail
        .sendWaitlistOpening(e.email, e.fullName, e.event.title, link)
        .catch(() => undefined);
      if (e.userId) {
        await this.notifications
          .notifyUsers([e.userId], {
            type: 'waitlist',
            title: 'Yer açıldı 🎟️',
            body: `${e.event.title} — bekleme listenden yer açıldı`,
            href: '/hesap',
          })
          .catch(() => undefined);
      }
    }
    if (next.length) {
      this.logger.log(`Waitlist: notified ${next.length} for tier ${tierId}`);
    }
    return next.length;
  }
}
