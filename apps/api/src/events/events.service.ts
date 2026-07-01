import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventStatus, Prisma, Role } from '@prisma/client';
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

  // ------- canlı yayın (livestream) -------

  /** Şu an canlı yayınlanan yayınlı etkinlikler (public — ana sayfa vitrini). */
  liveList() {
    return this.prisma.event.findMany({
      where: { status: EventStatus.PUBLISHED, liveStatus: 'LIVE', streamUrl: { not: null } },
      select: { slug: true, title: true, coverUrl: true, liveStartedAt: true },
      orderBy: { liveStartedAt: 'desc' },
      take: 5,
    });
  }

  /** Organizatör: yayını başlat/bitir. */
  async setLive(id: string, live: boolean) {
    return this.prisma.event.update({
      where: { id },
      data: {
        liveStatus: live ? 'LIVE' : 'ENDED',
        liveStartedAt: live ? new Date() : undefined,
      },
      select: { id: true, liveStatus: true, liveStartedAt: true },
    });
  }

  /**
   * Public yayın meta'sı. Yayın URL'sini YALNIZCA herkese açık (PUBLIC) + canlı
   * yayında döndürür; MEMBERS/PAID için URL `/stream/play` (kimlik doğrulamalı)
   * ucundan verilir — böylece korumalı yayın linki sızmaz.
   */
  async streamMeta(slug: string) {
    const e = await this.prisma.event.findUnique({
      where: { slug },
      select: {
        title: true, slug: true, coverUrl: true, status: true,
        liveStatus: true, streamUrl: true, streamAccess: true,
        streamPriceMinor: true, liveStartedAt: true,
      },
    });
    if (!e || e.status !== EventStatus.PUBLISHED) throw new NotFoundException('Event not found');
    const isLive = e.liveStatus === 'LIVE' && !!e.streamUrl;
    return {
      title: e.title,
      slug: e.slug,
      coverUrl: e.coverUrl,
      liveStatus: e.liveStatus,
      access: e.streamAccess,
      priceMinor: e.streamPriceMinor ?? null,
      liveStartedAt: e.liveStartedAt,
      isLive,
      playbackUrl: isLive && e.streamAccess === 'PUBLIC' ? e.streamUrl : undefined,
    };
  }

  /** Kimlik doğrulamalı: yetkiliyse yayın URL'sini döndürür (MEMBERS=her üye, PAID=ödenmiş sipariş, staff=her zaman). */
  async streamPlay(slug: string, userId: string, role: Role) {
    const e = await this.prisma.event.findUnique({
      where: { slug },
      select: { id: true, status: true, liveStatus: true, streamUrl: true, streamAccess: true },
    });
    if (!e || e.status !== EventStatus.PUBLISHED) throw new NotFoundException('Event not found');
    if (e.liveStatus !== 'LIVE' || !e.streamUrl) {
      throw new ForbiddenException('Yayın şu an aktif değil.');
    }
    const staff = role === Role.SUPERADMIN || role === Role.ADMIN || role === Role.EDITOR;
    if (staff || e.streamAccess === 'PUBLIC' || e.streamAccess === 'MEMBERS') {
      return { playbackUrl: e.streamUrl };
    }
    // PAID — bu etkinlik için ödenmiş sipariş şart
    const paid = await this.prisma.order.findFirst({
      where: { eventId: e.id, userId, status: 'PAID' },
      select: { id: true },
    });
    if (!paid) throw new ForbiddenException('Bu yayını izlemek için bilet/ödeme gerekli.');
    return { playbackUrl: e.streamUrl };
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
