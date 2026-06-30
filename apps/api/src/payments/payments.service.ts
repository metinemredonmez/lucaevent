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
import { Order } from '@prisma/client';
import { MockProvider } from './providers/mock.provider';
import { IyzicoProvider } from './providers/iyzico.provider';
import {
  PaymentProvider,
  ParsedWebhook,
  CheckoutResult,
  CheckoutContext,
} from './providers/payment.provider';
import { SettingsService } from '../settings/settings.service';

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
    private readonly settings: SettingsService,
  ) {
    this.providers = new Map<string, PaymentProvider>([
      [mock.name, mock],
      [iyzico.name, iyzico],
    ]);
  }

  /** Aktif sağlayıcı: admin Ayarlar (payment.provider) → env → 'mock'. */
  private async getProvider(name?: string): Promise<PaymentProvider> {
    const key =
      name ||
      (await this.settings.get('payment.provider')) ||
      this.config.get<string>('PAYMENT_PROVIDER') ||
      'mock';
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

  /** Aktif sağlayıcıyla ödeme başlatır; provider + providerId'yi siparişe yazar. */
  async createCheckout(order: Order, ctx?: CheckoutContext): Promise<CheckoutResult> {
    const provider = await this.getProvider();
    const result = await provider.createCheckout(order, ctx);
    await this.prisma.order.update({
      where: { id: order.id },
      data: { provider: provider.name, providerId: result.providerId },
    });
    return result;
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
      await this.notifications.notifyUsers([order.userId], {
        type: 'order',
        title: 'Biletin hazır 🎟️',
        body: `${order.event.title} — ${ticketCount} bilet onaylandı`,
        href: '/hesap',
      });
    }
  }

  /**
   * Core webhook handler. Idempotent and transactional.
   * Returns a small ack object; always succeeds for handled cases.
   */
  async handleWebhook(payload: any, headers: Record<string, any>) {
    const provider = await this.getProvider();

    if (!provider.verifyWebhook(payload, headers)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return this.applyResult(provider.parseWebhook(payload));
  }

  /**
   * Iyzico hosted ödeme callback'i: token ile sonucu Iyzico'dan çek, siparişi
   * atomik PAID/FAILED işaretle. (Iyzico klasik webhook değil callback kullanır.)
   */
  async handleIyzicoCallback(
    token: string,
  ): Promise<{ ok: boolean; orderCode?: string; status: 'PAID' | 'FAILED' }> {
    const parsed = await this.iyzico.retrieveByToken(token);
    if (!parsed.orderCode) return { ok: false, status: 'FAILED' };

    const order = await this.prisma.order.findUnique({
      where: { code: parsed.orderCode },
      select: { status: true, providerId: true },
    });
    if (!order) return { ok: false, status: 'FAILED' };
    // Idempotent: zaten ödenmişse başarı dön (PAID'de providerId değiştiği için
    // token eşleşmesi aranmaz — yeniden oynatılan callback no-op).
    if (order.status === 'PAID') {
      return { ok: true, orderCode: parsed.orderCode, status: 'PAID' };
    }
    // Defense-in-depth: token bu siparişin checkout'unda saklanan token olmalı.
    // Sızan/yeniden oynatılan bir token başka bir PENDING siparişi PAID yapamaz.
    if (order.providerId !== token) {
      return { ok: false, status: 'FAILED' };
    }
    // Belirsiz sonuç (3DS devam ediyor / paymentStatus yok): siparişi ne PAID ne
    // FAILED yap — PENDING bırak (abandoned-sweep cron temizler).
    if (parsed.status === 'PENDING') {
      return { ok: false, status: 'FAILED' };
    }
    await this.applyResult(parsed as ParsedWebhook & { providerId?: string });
    return { ok: true, orderCode: parsed.orderCode, status: parsed.status };
  }

  /** Parse edilmiş sonucu (PAID/FAILED) idempotent + atomik uygular. */
  private async applyResult(parsed: ParsedWebhook & { providerId?: string }) {
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
        data: {
          status: 'PAID',
          paidAt: new Date(),
          // İade için gerçek ödeme işlem kimliğini sakla (Iyzico).
          ...(parsed.providerId ? { providerId: parsed.providerId } : {}),
        },
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
    // Gerçek bir ödeme işlem kimliği yoksa sağlayıcıya iade gönderemeyiz.
    if (!order.providerId) {
      throw new ConflictException('REFUND_NOT_AVAILABLE');
    }

    const provider = await this.getProvider(order.provider);
    const restoreStock = order.event.startsAt > new Date();

    // 1) Önce atomik olarak PAID->REFUNDED kapısını al — yalnız tek eşzamanlı
    //    iade ilerler; böylece sağlayıcıya ÇİFT iade ve çift stok iadesi olmaz.
    const gate = await this.prisma.order.updateMany({
      where: { id: order.id, status: 'PAID' },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });
    if (gate.count === 0) {
      throw new ConflictException('ORDER_NOT_PAID');
    }

    // 2) Sağlayıcı çağrısını DB transaction'ı DIŞINDA yap (dış ağ çağrısı bir
    //    DB transaction'ını açık tutmamalı). Başarısız olursa siparişi PAID'e
    //    geri al (telafi) ki admin güvenle yeniden deneyebilsin.
    try {
      await provider.refund(order.providerId, order.totalMinor);
    } catch (e) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID', refundedAt: null },
      });
      throw e;
    }

    // 3) Stok iadesi + bekleme listesi (yalnız kapıyı kazanan buraya ulaşır).
    if (restoreStock) {
      await this.prisma.$transaction(
        order.items.map((item) =>
          this.prisma.ticketTier.update({
            where: { id: item.tierId },
            data: { sold: { decrement: item.qty } },
          }),
        ),
      );
      this.notifyWaitlist(order.items);
    }

    return this.prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });
  }

  /** Freed stock → notify waitlist (fire-and-forget, post-commit). */
  private notifyWaitlist(items: { tierId: string; qty: number }[]) {
    for (const item of items) {
      void this.waitlist.notifyNext(item.tierId, item.qty).catch(() => undefined);
    }
  }
}
