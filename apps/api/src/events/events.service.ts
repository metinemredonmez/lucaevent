import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventCreateDto, EventQueryDto, EventUpdateDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
  ) {}

  async listPublic(q: EventQueryDto) {
    const where: Prisma.EventWhereInput = { status: EventStatus.PUBLISHED };
    if (q.kind) where.kind = q.kind;
    if (q.categoryId) where.categoryId = q.categoryId;

    // date window
    const win = this.rangeWindow(q.range);
    if (win) where.startsAt = win;

    // free: at least one zero-price active tier
    if (q.free) {
      where.tickets = { some: { priceMinor: 0 } };
    }

    // full-text-ish search across title/tagline/description
    if (q.q && q.q.trim()) {
      const term = q.q.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { tagline: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    // near: bounding-box on venue lat/lng (approx; good enough without PostGIS)
    if (q.lat != null && q.lng != null) {
      const r = q.radiusKm ?? 25;
      const latDelta = r / 111;
      const lngDelta = r / (111 * Math.max(0.01, Math.cos((q.lat * Math.PI) / 180)));
      where.venue = {
        lat: { gte: q.lat - latDelta, lte: q.lat + latDelta },
        lng: { gte: q.lng - lngDelta, lte: q.lng + lngDelta },
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        take: q.take ?? 20,
        skip: q.skip ?? 0,
        orderBy: { startsAt: q.range === 'past' ? 'desc' : 'asc' },
        include: {
          venue: { select: { id: true, name: true, city: true, address: true, lat: true, lng: true } },
          category: { select: { id: true, slug: true, name: true, icon: true, color: true } },
          lineup: {
            include: { artist: { select: { id: true, name: true, slug: true } } },
            orderBy: { order: 'asc' },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return { items, total, take: q.take ?? 20, skip: q.skip ?? 0 };
  }

  private rangeWindow(range?: string): Prisma.DateTimeFilter | undefined {
    const now = new Date();
    const startOfDay = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };
    const endOfDay = (d: Date) => {
      const x = new Date(d);
      x.setHours(23, 59, 59, 999);
      return x;
    };
    switch (range) {
      case 'past':
        return { lt: now };
      case 'today':
        return { gte: now, lte: endOfDay(now) };
      case 'tomorrow': {
        const t = new Date(now);
        t.setDate(t.getDate() + 1);
        return { gte: startOfDay(t), lte: endOfDay(t) };
      }
      case 'weekend': {
        const day = now.getDay(); // 0 Sun .. 6 Sat
        if (day === 0) return { gte: now, lte: endOfDay(now) }; // Sunday: ends today
        const sat = startOfDay(now);
        sat.setDate(sat.getDate() + (6 - day)); // upcoming Saturday
        const sunEnd = endOfDay(new Date(sat.getTime() + 86_400_000));
        return { gte: sat < now ? now : sat, lte: sunEnd };
      }
      case 'upcoming':
        return { gte: now };
      default:
        return undefined;
    }
  }

  async bySlug(slug: string) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: {
        venue: true,
        category: true,
        lineup: {
          include: { artist: true },
          orderBy: { order: 'asc' },
        },
        tickets: { orderBy: { position: 'asc' } },
        media: true,
        heroMedia: true,
      },
    });
    if (!event || event.status !== EventStatus.PUBLISHED) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  // ------- admin ops -------

  listAll(q: EventQueryDto) {
    const where: Prisma.EventWhereInput = {};
    if (q.kind) where.kind = q.kind;
    if (q.categoryId) where.categoryId = q.categoryId;
    return this.prisma.event.findMany({
      where,
      take: q.take ?? 50,
      skip: q.skip ?? 0,
      orderBy: { startsAt: 'desc' },
      include: {
        venue: { select: { name: true, city: true } },
        category: { select: { name: true, slug: true } },
        _count: { select: { tickets: true, orders: true } },
        tickets: { select: { sold: true, capacity: true, priceMinor: true } },
      },
    });
  }

  byId(id: string) {
    return this.prisma.event.findUniqueOrThrow({
      where: { id },
      include: { venue: true, lineup: { include: { artist: true } }, tickets: true, media: true },
    });
  }

  create(dto: EventCreateDto) {
    return this.prisma.event.create({
      data: {
        ...dto,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        doorsAt: dto.doorsAt ? new Date(dto.doorsAt) : undefined,
        status: EventStatus.DRAFT,
      },
    });
  }

  update(id: string, dto: EventUpdateDto) {
    const { startsAt, endsAt, doorsAt, ...rest } = dto;
    return this.prisma.event.update({
      where: { id },
      data: {
        ...rest,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt ? new Date(endsAt) : undefined,
        doorsAt: doorsAt ? new Date(doorsAt) : undefined,
      },
    });
  }

  async publish(id: string) {
    return this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.PUBLISHED, publishedAt: new Date() },
    });
  }

  async unpublish(id: string) {
    return this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.DRAFT },
    });
  }

  remove(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }

  /** Cancel an event: refund all PAID orders, restore stock, close waitlist, notify. */
  async cancel(id: string) {
    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id },
      select: { id: true, title: true, status: true },
    });
    if (event.status === EventStatus.CANCELED) {
      return { ok: true, alreadyCanceled: true, refunded: 0 };
    }
    const paid = await this.prisma.order.findMany({
      where: { eventId: id, status: 'PAID' },
      include: { items: true },
    });

    await this.prisma.$transaction([
      this.prisma.event.update({ where: { id }, data: { status: EventStatus.CANCELED } }),
      ...paid.map((o) =>
        this.prisma.order.update({
          where: { id: o.id },
          data: { status: 'REFUNDED', refundedAt: new Date() },
        }),
      ),
      ...paid.flatMap((o) =>
        o.items.map((it) =>
          this.prisma.ticketTier.update({
            where: { id: it.tierId },
            data: { sold: { decrement: it.qty } },
          }),
        ),
      ),
      this.prisma.waitlistEntry.updateMany({
        where: { eventId: id, status: { in: ['WAITING', 'NOTIFIED'] } },
        data: { status: 'CANCELED' },
      }),
    ]);

    // notify attendees (post-commit). NOTE: provider money-refund (real Iyzico)
    // should be wired here when the live provider lands — backlog.
    for (const o of paid) {
      await this.mail.sendEventCanceled(o.email, o.fullName, event.title).catch(() => undefined);
    }
    // uygulama-içi bildirim — hesabı olan katılımcılara
    const userIds = paid
      .map((o) => o.userId)
      .filter((u): u is string => !!u);
    if (userIds.length) {
      await this.notifications
        .notifyUsers(userIds, {
          type: 'event',
          title: 'Etkinlik iptal edildi',
          body: `${event.title} iptal edildi — ücret iadesi yapılacak.`,
          href: '/hesap',
        })
        .catch(() => undefined);
    }
    this.logger.log(`Event ${id} canceled — refunded ${paid.length} order(s)`);
    return { ok: true, refunded: paid.length };
  }

  async icsForSlug(slug: string): Promise<string> {
    const e = await this.prisma.event.findUnique({
      where: { slug },
      include: { venue: true },
    });
    if (!e || e.status !== EventStatus.PUBLISHED) {
      throw new NotFoundException('Event not found');
    }
    const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = e.endsAt ?? new Date(e.startsAt.getTime() + 2 * 3_600_000);
    const loc = e.venue
      ? `${e.venue.name}${e.venue.address ? ', ' + e.venue.address : ''}`
      : '';
    const esc = (s: string | null) =>
      (s ?? '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Luca//Events//TR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${e.id}@luca`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(e.startsAt)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(e.title)}`,
      `DESCRIPTION:${esc(e.tagline ?? e.description)}`,
      loc ? `LOCATION:${esc(loc)}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .filter(Boolean)
      .join('\r\n');
  }
}
