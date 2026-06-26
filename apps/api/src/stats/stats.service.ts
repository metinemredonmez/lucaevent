import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { EventStatus, OrderStatus, ReservationStatus } from '@prisma/client';
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
    const grouped = await this.prisma.order.groupBy({
      by: ['eventId'],
      where: { status: OrderStatus.PAID },
      _sum: { totalMinor: true },
      orderBy: { _sum: { totalMinor: 'desc' } },
    });

    if (grouped.length === 0) return null;

    // Walk in revenue order until we find one that is still PUBLISHED.
    for (const g of grouped) {
      const event = await this.prisma.event.findFirst({
        where: { id: g.eventId, status: EventStatus.PUBLISHED },
        select: { id: true, title: true },
      });
      if (!event) continue;

      const revenueMinor = g._sum.totalMinor ?? 0;

      // Sum of paid units (OrderItem.qty) for this event's paid orders.
      const unitsAgg = await this.prisma.orderItem.aggregate({
        where: { order: { eventId: event.id, status: OrderStatus.PAID } },
        _sum: { qty: true },
      });

      return {
        id: event.id,
        title: event.title,
        soldUnits: unitsAgg._sum.qty ?? 0,
        revenueMinor,
      };
    }

    return null;
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
