import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEventSeriesDto } from './dto/event-series.dto';

interface TierTemplate {
  name: string;
  priceMinor: number;
  capacity: number;
}

const DAY_MS = 86_400_000;
const MAX_OCCURRENCES = 200; // runaway guard
const DEFAULT_HORIZON_DAYS = 90;

@Injectable()
export class EventSeriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateEventSeriesDto) {
    return this.prisma.eventSeries.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        tierTemplate: dto.tierTemplate as unknown as Prisma.InputJsonValue,
        agenda: dto.agenda as unknown as Prisma.InputJsonValue,
        included: dto.included as unknown as Prisma.InputJsonValue,
        bringList: dto.bringList as unknown as Prisma.InputJsonValue,
      },
    });
  }

  list() {
    return this.prisma.eventSeries.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { events: true } } },
    });
  }

  byId(id: string) {
    return this.prisma.eventSeries.findUniqueOrThrow({
      where: { id },
      include: {
        events: {
          orderBy: { startsAt: 'asc' },
          select: { id: true, slug: true, startsAt: true, status: true },
        },
      },
    });
  }

  remove(id: string) {
    // occurrences keep existing (Event.series is SET NULL on delete)
    return this.prisma.eventSeries.delete({ where: { id } });
  }

  /**
   * Generate concrete Event occurrences for the series up to `until` (or the
   * series endDate, or +90d). Idempotent: occurrences are upserted by slug, so
   * re-running only fills gaps. Each occurrence gets its own ticket tiers.
   */
  async generate(id: string, untilISO?: string) {
    const series = await this.prisma.eventSeries.findUniqueOrThrow({ where: { id } });
    const tiers = (series.tierTemplate as unknown as TierTemplate[]) ?? [];
    if (!Array.isArray(tiers) || tiers.length === 0) {
      throw new BadRequestException('Series has no tierTemplate');
    }

    const start = this.startOfDay(series.startDate);
    const horizon = untilISO
      ? new Date(untilISO)
      : (series.endDate ?? new Date(start.getTime() + DEFAULT_HORIZON_DAYS * DAY_MS));

    const [hh, mm] = series.startTime.split(':').map((n) => parseInt(n, 10));
    const dates = this.computeDates(series, start, horizon, hh, mm);

    let created = 0;
    let skipped = 0;
    for (const date of dates.slice(0, MAX_OCCURRENCES)) {
      const slug = `${series.slug}-${this.ymd(date)}`;
      const exists = await this.prisma.event.findUnique({ where: { slug }, select: { id: true } });
      if (exists) {
        skipped++;
        continue;
      }
      await this.prisma.event.create({
        data: {
          slug,
          title: series.title,
          tagline: series.tagline,
          description: series.description,
          kind: series.kind,
          categoryId: series.categoryId,
          venueId: series.venueId,
          seriesId: series.id,
          startsAt: date,
          endsAt: new Date(date.getTime() + series.durationMin * 60_000),
          status: 'PUBLISHED',
          publishedAt: new Date(),
          agenda: (series.agenda as Prisma.InputJsonValue) ?? undefined,
          included: (series.included as Prisma.InputJsonValue) ?? undefined,
          bringList: (series.bringList as Prisma.InputJsonValue) ?? undefined,
          ageMin: series.ageMin,
          tickets: {
            create: tiers.map((t, i) => ({
              name: t.name,
              priceMinor: t.priceMinor,
              capacity: t.capacity,
              position: i,
            })),
          },
        },
      });
      created++;
    }

    return { created, skipped, total: dates.length, capped: dates.length > MAX_OCCURRENCES };
  }

  // ---- date helpers ----

  private computeDates(
    series: { freq: string; interval: number; weekdays: number[]; endDate: Date | null },
    start: Date,
    horizon: Date,
    hh: number,
    mm: number,
  ): Date[] {
    const out: Date[] = [];
    const interval = Math.max(1, series.interval);
    for (let d = new Date(start); d <= horizon; d = new Date(d.getTime() + DAY_MS)) {
      if (series.endDate && this.startOfDay(d) > this.startOfDay(series.endDate)) break;
      const daysSince = Math.round((this.startOfDay(d).getTime() - start.getTime()) / DAY_MS);
      let match = false;
      if (series.freq === 'DAILY') {
        match = daysSince % interval === 0;
      } else {
        match =
          series.weekdays.includes(d.getDay()) &&
          Math.floor(daysSince / 7) % interval === 0;
      }
      if (match) {
        const occ = this.startOfDay(d);
        occ.setHours(hh, mm, 0, 0);
        out.push(occ);
      }
    }
    return out;
  }

  private startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private ymd(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  }
}
