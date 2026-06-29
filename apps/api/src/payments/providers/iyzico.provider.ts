import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from '@prisma/client';

import {
  CheckoutResult,
  ParsedWebhook,
  PaymentProvider,
} from './payment.provider';
import { SettingsService } from '../../settings/settings.service';

// iyzipay CommonJS SDK — tipsiz; any olarak kullanılır (src/iyzipay.d.ts).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Iyzipay = require('iyzipay');

export type IyzicoRetrieveResult = ParsedWebhook & { providerId?: string };

/**
 * Iyzico Checkout Form akışı:
 *  1) createCheckout -> initialize -> {paymentPageUrl, token}; kullanıcı hosted
 *     sayfaya yönlendirilir.
 *  2) Ödeme sonrası Iyzico bizim callbackUrl'imize token POST eder.
 *  3) PaymentsService callback'te retrieveByToken ile sonucu çeker ve siparişi
 *     atomik olarak PAID/FAILED işaretler.
 * Anahtarlar admin Ayarlar'dan (SettingsService) okunur — env/kod değil.
 */
@Injectable()
export class IyzicoProvider implements PaymentProvider {
  readonly name = 'iyzico';
  private readonly logger = new Logger(IyzicoProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly settings: SettingsService,
  ) {}

  private async client(): Promise<any> {
    const [apiKey, secretKey, uri] = await Promise.all([
      this.settings.get('payment.iyzico.apiKey'),
      this.settings.get('payment.iyzico.secret'),
      this.settings.get('payment.iyzico.baseUrl'),
    ]);
    if (!apiKey || !secretKey) {
      throw new Error(
        'Iyzico anahtarları ayarlı değil — Ayarlar → Ödeme bölümünden girin.',
      );
    }
    return new Iyzipay({
      apiKey,
      secretKey,
      uri: uri || 'https://sandbox-api.iyzipay.com',
    });
  }

  private price(minor: number): string {
    return (minor / 100).toFixed(2);
  }

  private call<T = any>(fn: (cb: (e: any, r: any) => void) => void): Promise<T> {
    return new Promise((resolve, reject) =>
      fn((err, res) => (err ? reject(err) : resolve(res))),
    );
  }

  async createCheckout(order: Order): Promise<CheckoutResult> {
    const iyzipay = await this.client();
    const apiBase = this.config.get<string>('APP_URL') || 'http://localhost:3001';
    const callbackUrl = `${apiBase}/api/v1/payments/iyzico/callback`;
    const price = this.price(order.totalMinor);
    const [firstName, ...rest] = (order.fullName || 'Luca Üye').trim().split(/\s+/);
    const lastName = rest.join(' ') || firstName;

    const request = {
      locale: 'tr',
      conversationId: order.code,
      price,
      paidPrice: price,
      currency: order.currency || 'TRY',
      basketId: order.code,
      paymentGroup: 'PRODUCT',
      callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: order.userId || order.code,
        name: firstName,
        surname: lastName,
        gsmNumber: order.phone || '+905350000000',
        email: order.email,
        identityNumber: '11111111111',
        registrationAddress: 'İstanbul',
        ip: '85.34.78.112',
        city: 'İstanbul',
        country: 'Turkey',
      },
      shippingAddress: { contactName: order.fullName || 'Luca Üye', city: 'İstanbul', country: 'Turkey', address: 'İstanbul' },
      billingAddress: { contactName: order.fullName || 'Luca Üye', city: 'İstanbul', country: 'Turkey', address: 'İstanbul' },
      basketItems: [
        { id: order.eventId, name: 'Etkinlik bileti', category1: 'Etkinlik', itemType: 'VIRTUAL', price },
      ],
    };

    const result = await this.call((cb) => iyzipay.checkoutFormInitialize.create(request, cb));
    if (result.status !== 'success' || !result.paymentPageUrl) {
      this.logger.error(`Iyzico initialize failed: ${result.errorCode} ${result.errorMessage}`);
      throw new Error(result.errorMessage || 'Iyzico ödeme başlatılamadı.');
    }
    return { checkoutUrl: result.paymentPageUrl, providerId: result.token };
  }

  /** Callback token'ından ödeme sonucunu çeker. */
  async retrieveByToken(token: string): Promise<IyzicoRetrieveResult> {
    const iyzipay = await this.client();
    const result = await this.call((cb) =>
      iyzipay.checkoutForm.retrieve({ locale: 'tr', token }, cb),
    );
    const paid = result.status === 'success' && result.paymentStatus === 'SUCCESS';
    // İade için kullanılacak gerçek id: itemTransaction.paymentTransactionId.
    const providerId =
      result.itemTransactions?.[0]?.paymentTransactionId || result.paymentId || undefined;
    return {
      orderCode: result.basketId,
      status: paid ? 'PAID' : 'FAILED',
      providerId,
    };
  }

  // Iyzico klasik (signature'lı body) webhook kullanmaz — generic /payments/webhook
  // bu sağlayıcı için reddedilir; callback /payments/iyzico/callback'te işlenir.
  verifyWebhook(): boolean {
    return false;
  }
  parseWebhook(): ParsedWebhook {
    throw new Error('Iyzico ödemesi /payments/iyzico/callback üzerinden işlenir.');
  }

  async refund(providerId: string, amountMinor: number): Promise<void> {
    if (!providerId) throw new Error('İade için ödeme işlem kimliği yok.');
    const iyzipay = await this.client();
    const result = await this.call((cb) =>
      iyzipay.refund.create(
        {
          locale: 'tr',
          conversationId: providerId,
          paymentTransactionId: providerId,
          price: this.price(amountMinor),
          currency: 'TRY',
          ip: '85.34.78.112',
        },
        cb,
      ),
    );
    if (result.status !== 'success') {
      this.logger.error(`Iyzico refund failed: ${result.errorMessage}`);
      throw new Error(result.errorMessage || 'Iyzico iade başarısız.');
    }
  }
}
