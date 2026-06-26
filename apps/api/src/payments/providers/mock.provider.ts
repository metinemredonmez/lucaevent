import { Injectable } from '@nestjs/common';
import { Order } from '@prisma/client';

import {
  CheckoutResult,
  ParsedWebhook,
  PaymentProvider,
} from './payment.provider';

@Injectable()
export class MockProvider implements PaymentProvider {
  readonly name = 'mock';

  async createCheckout(order: Order): Promise<CheckoutResult> {
    return {
      checkoutUrl: '/api/v1/payments/mock/checkout/' + order.code,
      providerId: 'mock_' + order.code,
    };
  }

  // DEV ONLY: trusts the incoming payload. In production this MUST refuse —
  // otherwise an unauthenticated POST /payments/webhook { status:'PAID' } would
  // mint free tickets. Real payment requires a signature-verifying provider.
  verifyWebhook(_payload: any, _headers: Record<string, any>): boolean {
    return process.env.NODE_ENV !== 'production';
  }

  parseWebhook(payload: any): ParsedWebhook {
    return {
      orderCode: payload?.orderCode,
      status: payload?.status === 'PAID' ? 'PAID' : 'FAILED',
    };
  }

  async refund(_providerId: string, _amountMinor: number): Promise<void> {
    // no-op in dev
    return;
  }
}
