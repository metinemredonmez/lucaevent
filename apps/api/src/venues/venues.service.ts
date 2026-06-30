import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { VenueCreateDto, VenueUpdateDto } from './dto/venue.dto';

@Injectable()
export class VenuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /** Public harita yapılandırması — Mapbox public token (gizli değil; admin'den yönetilir). */
  async mapsConfig(): Promise<{ token: string; configured: boolean }> {
    try {
      const token = await this.settings.get('maps.mapbox.token');
      return { token: token || '', configured: Boolean(token) };
    } catch {
      return { token: '', configured: false };
    }
  }

  list() {
    return this.prisma.venue.findMany({ orderBy: { name: 'asc' } });
  }

  /**
   * Admin liste — her mekana o anki etkinlik durumunu iliştirir:
   * status 'live' (şu an devam eden yayınlı etkinlik), 'upcoming' (gelecek
   * etkinliği var) veya 'idle'. Harita pinlerini renklendirmek + "mekan
   * şu an aktif mi" göstermek için. Tek sorguda toplayıp JS'te kovalıyor.
   */
  async listAdmin() {
    const venues = await this.prisma.venue.findMany({ orderBy: { name: 'asc' } });
    if (venues.length === 0) return [];

    const events = await this.prisma.event.findMany({
      where: { venueId: { in: venues.map((v) => v.id) }, status: 'PUBLISHED' },
      select: { id: true, venueId: true, title: true, slug: true, startsAt: true, endsAt: true },
      orderBy: { startsAt: 'asc' },
    });

    const DEFAULT_DURATION_MS = 4 * 60 * 60 * 1000; // endsAt yoksa varsayılan süre
    const nowMs = Date.now();
    const byVenue = new Map<string, typeof events>();
    for (const e of events) {
      if (!e.venueId) continue;
      const arr = byVenue.get(e.venueId);
      if (arr) arr.push(e);
      else byVenue.set(e.venueId, [e]);
    }

    return venues.map((v) => {
      const evs = byVenue.get(v.id) ?? [];
      const live =
        evs.find((e) => {
          const start = e.startsAt.getTime();
          const end = (e.endsAt ?? new Date(start + DEFAULT_DURATION_MS)).getTime();
          return start <= nowMs && end >= nowMs;
        }) ?? null;
      const upcoming = evs.filter((e) => e.startsAt.getTime() > nowMs);
      const next = upcoming[0] ?? null;
      return {
        ...v,
        status: live ? 'live' : upcoming.length > 0 ? 'upcoming' : 'idle',
        liveEvent: live
          ? { id: live.id, title: live.title, slug: live.slug, startsAt: live.startsAt, endsAt: live.endsAt }
          : null,
        nextEvent: next ? { id: next.id, title: next.title, slug: next.slug, startsAt: next.startsAt } : null,
        upcomingCount: upcoming.length,
        totalEvents: evs.length,
      };
    });
  }

  async bySlug(slug: string) {
    const v = await this.prisma.venue.findUnique({ where: { slug } });
    if (!v) throw new NotFoundException('Venue not found');
    return v;
  }

  byId(id: string) {
    return this.prisma.venue.findUniqueOrThrow({ where: { id } });
  }

  create(dto: VenueCreateDto) {
    return this.prisma.venue.create({ data: dto });
  }

  update(id: string, dto: VenueUpdateDto) {
    return this.prisma.venue.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.venue.delete({ where: { id } });
  }
}
