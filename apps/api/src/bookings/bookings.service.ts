import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CouponsService } from '../coupons/coupons.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateBookingDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coupons: CouponsService,
    private readonly payments: PaymentsService,
  ) {}

  private genOrderCode(): string {
    return 'LUCA-' + randomBytes(4).toString('hex').toUpperCase();
  }

  async create(dto: CreateBookingDto) {
    const order = await this.prisma.$transaction(async (tx) => {
      // a. idempotent replay
      if (dto.idempotencyKey) {
        const existing = await tx.order.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
          include: { items: true },
        });
        if (existing) return existing;
      }

      // b. event lookup + status
      const event = await tx.event.findUnique({
        where: { id: dto.eventId },
        include: { tickets: true },
      });
      if (!event) throw new NotFoundException('Event not found');
      if (event.status !== 'PUBLISHED') {
        throw new ConflictException('EVENT_NOT_ON_SALE');
      }

      const now = new Date();
      let totalMinor = 0;
      const itemsData: { tierId: string; qty: number; unitMinor: number }[] = [];

      for (const item of dto.items) {
        // c. validate tier
        const tier = event.tickets.find((t) => t.id === item.tierId);
        if (!tier || tier.eventId !== dto.eventId) {
          throw new BadRequestException('TIER_NOT_FOUND');
        }
        if (
          tier.status !== 'ACTIVE' ||
          (tier.salesOpenAt && now < tier.salesOpenAt) ||
          (tier.salesCloseAt && now > tier.salesCloseAt)
        ) {
          throw new ConflictException('SALES_CLOSED');
        }
        // d. reserve stock ATOMICALLY. A read-then-increment is unsafe under
        // READ COMMITTED: two concurrent bookings of the last seats both pass a
        // `sold + qty <= capacity` read-check and both increment -> oversell.
        // A conditional updateMany takes the row lock and re-checks the committed
        // `sold`, so only one winner reserves the final seats.
        const reserved = await tx.ticketTier.updateMany({
          where: { id: tier.id, sold: { lte: tier.capacity - item.qty } },
          data: { sold: { increment: item.qty } },
        });
        if (reserved.count === 0) {
          throw new ConflictException('SOLD_OUT');
        }

        const unitMinor = tier.priceMinor;
        totalMinor += unitMinor * item.qty;
        itemsData.push({ tierId: tier.id, qty: item.qty, unitMinor });
      }

      // e. apply coupon (validate + atomically consume a use, inside this tx).
      // Discount is computed server-side from the subtotal — never trust client.
      let discountMinor = 0;
      let couponCode: string | null = null;
      if (dto.couponCode) {
        const applied = await this.coupons.applyInTx(
          tx,
          dto.couponCode,
          dto.eventId,
          totalMinor,
        );
        discountMinor = applied.discountMinor;
        couponCode = applied.code;
      }
      const finalTotal = totalMinor - discountMinor;

      // f. create order (PENDING) — no tickets issued here
      const created = await tx.order.create({
        data: {
          code: this.genOrderCode(),
          idempotencyKey: dto.idempotencyKey ?? null,
          status: 'PENDING',
          eventId: dto.eventId,
          email: dto.buyer.email,
          fullName: dto.buyer.fullName,
          phone: dto.buyer.phone,
          totalMinor: finalTotal,
          discountMinor,
          couponCode,
          currency: 'TRY',
          provider: 'mock',
          items: { create: itemsData },
        },
        include: { items: true },
      });

      return created;
    });

    // f. aktif sağlayıcıyla (mock | iyzico) ödeme başlat, checkout URL'ini dön
    const checkout = await this.payments.createCheckout(order);
    return {
      orderCode: order.code,
      status: order.status,
      totalMinor: order.totalMinor,
      currency: order.currency,
      checkoutUrl: checkout.checkoutUrl,
    };
  }

  // Bookings are created as guest checkout (userId null), so also match by the
  // account's email — otherwise "My Bookings" is always empty for purchases.
  myBookings(userId: string, email: string) {
    return this.prisma.order.findMany({
      where: { OR: [{ userId }, { email }] },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        event: { select: { title: true, slug: true, startsAt: true, coverUrl: true } },
      },
    });
  }

  async byCode(code: string) {
    const order = await this.prisma.order.findUnique({
      where: { code },
      include: {
        items: true,
        event: { select: { title: true, slug: true, startsAt: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    // Public lookup by (unguessable) code: strip sensitive buyer PII, mask email.
    const { phone: _p, fullName: _n, userId: _u, providerId: _pi, email, ...safe } = order;
    return { ...safe, email: this.maskEmail(email) };
  }

  private maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (!domain) return '***';
    const head = user.slice(0, 2);
    return `${head}${'*'.repeat(Math.max(1, user.length - 2))}@${domain}`;
  }
}
