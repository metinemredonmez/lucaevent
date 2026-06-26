import { randomBytes } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WaitlistService } from '../waitlist/waitlist.service';
import { MockProvider } from './providers/mock.provider';
import { IyzicoProvider } from './providers/iyzico.provider';
import { PaymentProvider } from './providers/payment.provider';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly providers: Map<string, PaymentProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    private readonly waitlist: WaitlistService,
    private readonly mock: MockProvider,
    private readonly iyzico: IyzicoProvider,
  ) {
    this.providers = new Map<string, PaymentProvider>([
      [mock.name, mock],
      [iyzico.name, iyzico],
    ]);
  }

  private getProvider(name?: string): PaymentProvider {
    const key = name ?? this.config.get<string>('PAYMENT_PROVIDER') ?? 'mock';
    const provider = this.providers.get(key);
    // Fail closed: never silently fall back to the (trust-all) mock provider.
    if (!provider) {
      throw new ServiceUnavailableException(`Unknown payment provider: ${key}`);
    }
    if (key === 'mock' && process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException('Mock payment provider is disabled in production');
    }
    return provider;
  }

  private genTicketCode(): string {
    return randomBytes(24).toString('base64url');
  }

  /** Post-payment: order confirmation email (+ push if a logged-in buyer). */
  private async notifyPaid(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        event: { select: { title: true, startsAt: true } },
      },
    });
    if (!order) return;

    const ticketCount = order.items.reduce((s, i) => s + i.qty, 0);
    const whenText = order.event.startsAt.toLocaleString('tr-TR');
    const link = `${this.config.get<string>('WEB_URL') ?? ''}/bookings/${order.code}`;

    await this.mail.sendOrderConfirmation(
      order.email,
      order.fullName,
      order.event.title,
      order.code,
      ticketCount,
      whenText,
      link,
    );

    if (order.userId) {
      await this.notifications.sendToUsers(
        [order.userId],
        'Biletin hazır 🎟️',
        `${order.event.title} — ${ticketCount} bilet onaylandı`,
        { url: link },
      );
    }
  }

  /**
   * Core webhook handler. Idempotent and transactional.
   * Returns a small ack object; always succeeds for handled cases.
   */
  async handleWebhook(payload: any, headers: Record<string, any>) {
    const provider = this.getProvider();

    if (!provider.verifyWebhook(payload, headers)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const parsed = provider.parseWebhook(payload);

    const order = await this.prisma.order.findUnique({
      where: { code: parsed.orderCode },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Idempotent: already paid -> no-op, never re-issue.
    if (order.status === 'PAID') {
      return { ok: true };
    }

    if (parsed.status === 'FAILED') {
      const restored = await this.prisma.$transaction(async (tx) => {
        // atomic gate: only the PENDING->FAILED winner restores stock, so two
        // concurrent FAILED webhooks cannot double-decrement `sold`.
        const gate = await tx.order.updateMany({
          where: { id: order.id, status: 'PENDING' },
          data: { status: 'FAILED' },
        });
        if (gate.count === 0) return false;
        for (const item of order.items) {
          await tx.ticketTier.update({
            where: { id: item.tierId },
            data: { sold: { decrement: item.qty } },
          });
        }
        return true;
      });
      if (restored) this.notifyWaitlist(order.items);
      return { ok: true };
    }

    // PAID: issue tickets — the ONLY place IssuedTickets are created.
    // The sequential `if (order.status === 'PAID')` check above is not enough:
    // two SIMULTANEOUS webhooks both read PENDING and would both issue tickets.
    // An atomic PENDING->PAID gate ensures exactly one webhook issues tickets.
    const issued = await this.prisma.$transaction(async (tx) => {
      const gate = await tx.order.updateMany({
        where: { id: order.id, status: 'PENDING' },
        data: { status: 'PAID', paidAt: new Date() },
      });
      if (gate.count === 0) return false; // concurrent webhook already paid it

      for (const item of order.items) {
        for (let i = 0; i < item.qty; i++) {
          await tx.issuedTicket.create({
            data: {
              code: this.genTicketCode(),
              orderId: order.id,
              tierId: item.tierId,
              holderName: order.fullName,
            },
          });
        }
      }
      return true;
    });

    // fire-and-forget notifications, only for the webhook that actually issued.
    // never let mail/push failure break the webhook.
    if (issued) {
      this.notifyPaid(order.id).catch((e) =>
        this.logger.error(`notifyPaid(${order.code}): ${(e as Error).message}`),
      );
    }

    return { ok: true };
  }

  /**
   * DEV helper: simulate a provider PAID webhook for an order code.
   */
  async mockPay(code: string) {
    // DEV-ONLY: this marks an order PAID without real payment. Never expose in
    // production — it would let anyone mint free tickets.
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    return this.handleWebhook(
      { orderCode: code, status: 'PAID' },
      {},
    );
  }

  async refund(code: string) {
    const order = await this.prisma.order.findUnique({
      where: { code },
      include: { items: true, event: { select: { startsAt: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PAID') {
      throw new ConflictException('ORDER_NOT_PAID');
    }

    const provider = this.getProvider(order.provider);
    await provider.refund(order.providerId ?? '', order.totalMinor);

    const restoreStock = order.event.startsAt > new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      // atomic PAID->REFUNDED gate guards against concurrent double-refund
      // (which would otherwise restore stock twice).
      const gate = await tx.order.updateMany({
        where: { id: order.id, status: 'PAID' },
        data: { status: 'REFUNDED', refundedAt: new Date() },
      });
      if (gate.count === 0) {
        throw new ConflictException('ORDER_NOT_PAID');
      }
      if (restoreStock) {
        for (const item of order.items) {
          await tx.ticketTier.update({
            where: { id: item.tierId },
            data: { sold: { decrement: item.qty } },
          });
        }
      }
      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { items: true },
      });
    });

    if (restoreStock) this.notifyWaitlist(order.items);
    return updated;
  }

  /** Freed stock → notify waitlist (fire-and-forget, post-commit). */
  private notifyWaitlist(items: { tierId: string; qty: number }[]) {
    for (const item of items) {
      void this.waitlist.notifyNext(item.tierId, item.qty).catch(() => undefined);
    }
  }
}
