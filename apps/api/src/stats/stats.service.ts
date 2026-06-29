import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  EventStatus,
  OrderStatus,
  ReservationStatus,
  SubmissionStatus,
  SubmissionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export class TopEvent {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ description: 'Total paid units sold for this event' })
  soldUnits!: number;

  @ApiProperty({ description: 'Paid revenue in minor units (kuruş)' })
  revenueMinor!: number;
}

export class AdminStatsResponse {
  @ApiProperty()
  totalEvents!: number;

  @ApiProperty()
  publishedEvents!: number;

  @ApiProperty({ description: 'Sum of Order.totalMinor where status=PAID, minor units' })
  totalSalesMinor!: number;

  @ApiProperty()
  paidOrders!: number;

  @ApiProperty()
  pendingOrders!: number;

  @ApiProperty()
  canceledOrders!: number;

  @ApiProperty({ description: 'canceledOrders / totalOrders, 0..1' })
  cancelRate!: number;

  @ApiProperty({ description: 'Count of Reservation with status=PENDING' })
  pendingReservations!: number;

  @ApiProperty({ type: TopEvent, nullable: true })
  topEvent!: TopEvent | null;

  @ApiProperty({ description: 'sum(sold) / sum(capacity) across TicketTier of PUBLISHED upcoming events, 0..1' })
  occupancyRate!: number;
}

export type DaySalesPoint = { date: string; revenueMinor: number; paidOrders: number };
export type DayCountPoint = { date: string; count: number };
export type CategoryCount = { name: string; slug: string | null; count: number };
export type TopEventRow = {
  id: string;
  title: string;
  coverUrl: string | null;
  soldUnits: number;
  revenueMinor: number;
};
export type ActivityItem = {
  type: 'reservation' | 'submission' | 'event';
  id: string;
  label: string;
  createdAt: string;
  status: string;
  href: string;
};

/** Richer dashboard payload — series, breakdowns and a merged activity feed.
 *  Every field is zero-safe so the UI renders even with no sales. */
export class DashboardExtrasResponse {
  @ApiProperty({ description: '30 gün, sıfır-dolu günlük gelir serisi' })
  revenueSeries!: DaySalesPoint[];

  @ApiProperty({ description: '14 gün, günlük toplam sipariş sayısı' })
  ordersSeries!: DayCountPoint[];

  @ApiProperty({ description: '14 gün, günlük rezervasyon sayısı' })
  reservationsSeries!: DayCountPoint[];

  @ApiProperty({ description: 'Her kategori için etkinlik sayısı (8 kategori daima döner)' })
  categoryCounts!: CategoryCount[];

  @ApiProperty({ description: 'Duruma göre etkinlik sayıları (5 durum)' })
  eventStatusCounts!: Record<string, number>;

  @ApiProperty()
  newSubmissions!: number;

  @ApiProperty()
  pendingOrders!: number;

  @ApiProperty()
  pendingReservations!: number;

  @ApiProperty({ description: 'Ödenmiş gelire göre ilk 3 yayınlı etkinlik' })
  topEvents!: TopEventRow[];

  @ApiProperty({ description: 'Rezervasyon + başvuru + etkinlik birleşik son hareketler (<=8)' })
  activity!: ActivityItem[];
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(): Promise<AdminStatsResponse> {
    const now = new Date();

    const [
      totalEvents,
      publishedEvents,
      paidAgg,
      paidOrders,
      pendingOrders,
      canceledOrders,
      totalOrders,
      pendingReservations,
    ] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.event.count({ where: { status: EventStatus.PUBLISHED } }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.PAID },
        _sum: { totalMinor: true },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.PAID } }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELED } }),
      this.prisma.order.count(),
      this.prisma.reservation.count({ where: { status: ReservationStatus.PENDING } }),
    ]);

    const totalSalesMinor = paidAgg._sum.totalMinor ?? 0;
    const cancelRate = totalOrders > 0 ? canceledOrders / totalOrders : 0;

    const topEvent = await this.computeTopEvent();
    const occupancyRate = await this.computeOccupancyRate(now);

    return {
      totalEvents,
      publishedEvents,
      totalSalesMinor,
      paidOrders,
      pendingOrders,
      canceledOrders,
      cancelRate,
      pendingReservations,
      topEvent,
      occupancyRate,
    };
  }

  // PUBLISHED event with the most paid revenue (sum of Order.totalMinor where status=PAID).
  private async computeTopEvent(): Promise<TopEvent | null> {
    const [top] = await this.topEvents(1);
    if (!top) return null;
    return {
      id: top.id,
      title: top.title,
      soldUnits: top.soldUnits,
      revenueMinor: top.revenueMinor,
    };
  }

  // Up to `limit` PUBLISHED events ranked by paid revenue (walks grouped totals,
  // skipping non-published events). Returns [] when there are no paid orders.
  private async topEvents(limit: number): Promise<TopEventRow[]> {
    const grouped = await this.prisma.order.groupBy({
      by: ['eventId'],
      where: { status: OrderStatus.PAID },
      _sum: { totalMinor: true },
      orderBy: { _sum: { totalMinor: 'desc' } },
    });

    const out: TopEventRow[] = [];
    for (const g of grouped) {
      if (out.length >= limit) break;
      const event = await this.prisma.event.findFirst({
        where: { id: g.eventId, status: EventStatus.PUBLISHED },
        select: { id: true, title: true, coverUrl: true },
      });
      if (!event) continue;

      const unitsAgg = await this.prisma.orderItem.aggregate({
        where: { order: { eventId: event.id, status: OrderStatus.PAID } },
        _sum: { qty: true },
      });

      out.push({
        id: event.id,
        title: event.title,
        coverUrl: event.coverUrl ?? null,
        soldUnits: unitsAgg._sum.qty ?? 0,
        revenueMinor: g._sum.totalMinor ?? 0,
      });
    }
    return out;
  }

  // ——— Richer dashboard payload (series + breakdowns + activity) ———
  async dashboardExtras(): Promise<DashboardExtrasResponse> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const since30 = this.daysAgo(startOfToday, 29);
    const since14 = this.daysAgo(startOfToday, 13);

    const [
      paidRows,
      orderRows,
      resRows,
      evByCat,
      cats,
      evByStatus,
      newSubmissions,
      pendingOrders,
      pendingReservations,
      recentRes,
      recentSub,
      recentEv,
      topEvents,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where: { status: OrderStatus.PAID, createdAt: { gte: since30 } },
        select: { createdAt: true, totalMinor: true },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: since14 } },
        select: { createdAt: true },
      }),
      this.prisma.reservation.findMany({
        where: { createdAt: { gte: since14 } },
        select: { createdAt: true },
      }),
      this.prisma.event.groupBy({ by: ['categoryId'], _count: { _all: true } }),
      this.prisma.category.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { position: 'asc' },
      }),
      this.prisma.event.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.submission.count({ where: { status: SubmissionStatus.NEW } }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.reservation.count({ where: { status: ReservationStatus.PENDING } }),
      this.prisma.reservation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, fullName: true, createdAt: true, status: true },
      }),
      this.prisma.submission.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, type: true, name: true, createdAt: true, status: true },
      }),
      this.prisma.event.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, title: true, createdAt: true, status: true },
      }),
      this.topEvents(3),
    ]);

    // revenue 30d (paid revenue + paid order count per day)
    const revMap = this.seedDays(startOfToday, 30);
    const revCount = this.seedDays(startOfToday, 30);
    for (const r of paidRows) {
      const k = this.dayKey(r.createdAt);
      if (revMap.has(k)) {
        revMap.set(k, (revMap.get(k) ?? 0) + r.totalMinor);
        revCount.set(k, (revCount.get(k) ?? 0) + 1);
      }
    }
    const revenueSeries: DaySalesPoint[] = [...revMap.entries()].map(([date, revenueMinor]) => ({
      date,
      revenueMinor,
      paidOrders: revCount.get(date) ?? 0,
    }));

    const ordersSeries = this.bucketCount(orderRows, startOfToday, 14);
    const reservationsSeries = this.bucketCount(resRows, startOfToday, 14);

    // category counts (all categories, 0-filled)
    const byCatId = new Map<string | null, number>();
    for (const g of evByCat) byCatId.set(g.categoryId, g._count._all);
    const categoryCounts: CategoryCount[] = cats.map((c) => ({
      name: c.name,
      slug: c.slug,
      count: byCatId.get(c.id) ?? 0,
    }));
    const uncategorized = byCatId.get(null) ?? 0;
    if (uncategorized > 0)
      categoryCounts.push({ name: 'Kategorisiz', slug: null, count: uncategorized });

    // event status counts (all 5 enum keys seeded)
    const eventStatusCounts: Record<string, number> = {
      PUBLISHED: 0,
      DRAFT: 0,
      SCHEDULED: 0,
      CANCELED: 0,
      ARCHIVED: 0,
    };
    for (const g of evByStatus) eventStatusCounts[g.status] = g._count._all;

    // merged activity feed (Turkish labels built server-side)
    const subTr: Record<SubmissionType, string> = {
      CONTACT: 'iletişim',
      EVENT_PROPOSAL: 'etkinlik',
      MEMBERSHIP: 'üyelik',
    };
    const activity: ActivityItem[] = [
      ...recentRes.map((r) => ({
        type: 'reservation' as const,
        id: r.id,
        label: `${r.fullName} rezervasyon oluşturdu`,
        createdAt: r.createdAt.toISOString(),
        status: r.status,
        href: '/admin/reservations',
      })),
      ...recentSub.map((s) => ({
        type: 'submission' as const,
        id: s.id,
        label: `Yeni ${subTr[s.type]} başvurusu — ${s.name}`,
        createdAt: s.createdAt.toISOString(),
        status: s.status,
        href: '/admin/submissions',
      })),
      ...recentEv.map((e) => ({
        type: 'event' as const,
        id: e.id,
        label: `Etkinlik eklendi: ${e.title}`,
        createdAt: e.createdAt.toISOString(),
        status: e.status,
        href: `/admin/events/${e.id}/edit`,
      })),
    ]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);

    return {
      revenueSeries,
      ordersSeries,
      reservationsSeries,
      categoryCounts,
      eventStatusCounts,
      newSubmissions,
      pendingOrders,
      pendingReservations,
      topEvents,
      activity,
    };
  }

  // ——— date bucketing helpers (JS, portable across DBs) ———
  private dayKey(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
  private daysAgo(from: Date, n: number): Date {
    const d = new Date(from);
    d.setDate(d.getDate() - n);
    return d;
  }
  private seedDays(startOfToday: Date, n: number): Map<string, number> {
    const m = new Map<string, number>();
    for (let i = n - 1; i >= 0; i--) m.set(this.dayKey(this.daysAgo(startOfToday, i)), 0);
    return m;
  }
  private bucketCount(rows: { createdAt: Date }[], startOfToday: Date, n: number): DayCountPoint[] {
    const m = this.seedDays(startOfToday, n);
    for (const r of rows) {
      const k = this.dayKey(r.createdAt);
      if (m.has(k)) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].map(([date, count]) => ({ date, count }));
  }

  // sum(sold) / sum(capacity) across TicketTier of PUBLISHED upcoming events.
  private async computeOccupancyRate(now: Date): Promise<number> {
    const agg = await this.prisma.ticketTier.aggregate({
      where: {
        event: {
          status: EventStatus.PUBLISHED,
          startsAt: { gte: now },
        },
      },
      _sum: { sold: true, capacity: true },
    });

    const sold = agg._sum.sold ?? 0;
    const capacity = agg._sum.capacity ?? 0;
    return capacity > 0 ? sold / capacity : 0;
  }
}
