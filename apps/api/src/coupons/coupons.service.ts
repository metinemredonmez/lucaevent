import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Coupon, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- discount logic ----------

  private computeDiscount(coupon: Coupon, subtotalMinor: number): number {
    const d =
      coupon.type === 'PERCENT'
        ? Math.floor((subtotalMinor * coupon.value) / 100)
        : coupon.value;
    return Math.max(0, Math.min(d, subtotalMinor)); // never exceed subtotal
  }

  private assertValid(
    coupon: Coupon | null,
    eventId: string,
    subtotalMinor: number,
    now: Date,
  ): asserts coupon is Coupon {
    if (!coupon || !coupon.isActive) throw new BadRequestException('INVALID_COUPON');
    if (coupon.startsAt && now < coupon.startsAt)
      throw new ConflictException('COUPON_NOT_STARTED');
    if (coupon.endsAt && now > coupon.endsAt)
      throw new ConflictException('COUPON_EXPIRED');
    if (coupon.eventId && coupon.eventId !== eventId)
      throw new ConflictException('COUPON_NOT_FOR_EVENT');
    if (coupon.minSubtotalMinor && subtotalMinor < coupon.minSubtotalMinor)
      throw new ConflictException('COUPON_MIN_NOT_MET');
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses)
      throw new ConflictException('COUPON_EXHAUSTED');
  }

  /** Read-only preview for the checkout UI (does NOT consume a use). */
  async validatePreview(code: string, eventId: string, subtotalMinor: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });
    this.assertValid(coupon, eventId, subtotalMinor, new Date());
    const discountMinor = this.computeDiscount(coupon, subtotalMinor);
    return {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountMinor,
      totalAfterMinor: subtotalMinor - discountMinor,
    };
  }

  /** Validate + atomically consume one use. Call inside the booking $transaction. */
  async applyInTx(
    tx: Prisma.TransactionClient,
    code: string,
    eventId: string,
    subtotalMinor: number,
  ) {
    const coupon = await tx.coupon.findUnique({ where: { code } });
    this.assertValid(coupon, eventId, subtotalMinor, new Date());
    const inc = await tx.coupon.updateMany({
      where: {
        id: coupon.id,
        ...(coupon.maxUses != null ? { usedCount: { lt: coupon.maxUses } } : {}),
      },
      data: { usedCount: { increment: 1 } },
    });
    if (inc.count === 0) throw new ConflictException('COUPON_EXHAUSTED');
    return { code: coupon.code, discountMinor: this.computeDiscount(coupon, subtotalMinor) };
  }

  // ---------- admin CRUD ----------

  list() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateCouponDto) {
    try {
      return await this.prisma.coupon.create({
        data: {
          ...dto,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Coupon code already exists');
      }
      throw e;
    }
  }

  update(id: string, dto: UpdateCouponDto) {
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
    });
  }

  async remove(id: string) {
    try {
      return await this.prisma.coupon.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Coupon not found');
      }
      throw e;
    }
  }
}
