import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { PlacesService } from './places.service';
import { VenueCreateDto, VenueUpdateDto } from './dto/venue.dto';

@Injectable()
export class VenuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly places: PlacesService,
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

  /**
   * Public harita — mekanlar + o anki durum + Google Places verisi.
   * Google koordinatı varsa DB'deki (çoğu zaman yanlış) lat/lng'yi ezer → pin
   * denizde kalmaz. Detay (telefon/saat/puan) `google` alanında döner; açık/kapalı
   * frontend'de saatlerden canlı hesaplanır. Key yoksa DB verisiyle çalışır.
   */
  async mapVenues() {
    const all = await this.listAdmin();
    const enriched = await Promise.all(
      all.map(async (v) => {
        const g = await this.places.enrich(v).catch(() => null);
        // ham cache alanlarını dışarı verme
        const { placeCache, placeCachedAt, ...rest } = v as Record<string, unknown>;
        return {
          ...rest,
          lat: g?.lat ?? (v.lat as number | null),
          lng: g?.lng ?? (v.lng as number | null),
          google: g ?? null,
        };
      }),
    );
    return enriched.filter((v) => v.lat != null && v.lng != null);
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
