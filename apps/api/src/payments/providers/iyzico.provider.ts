import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from '@prisma/client';

import {
  CheckoutResult,
  ParsedWebhook,
  PaymentProvider,
} from './payment.provider';

@Injectable()
export class IyzicoProvider implements PaymentProvider {
  readonly name = 'iyzico';

  private readonly apiKey?: string;
  private readonly secret?: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('IYZICO_API_KEY');
    this.secret = this.config.get<string>('IYZICO_SECRET');
  }

  async createCheckout(_order: Order): Promise<CheckoutResult> {
    throw new Error('Iyzico not implemented');
  }

  verifyWebhook(_payload: any, _headers: Record<string, any>): boolean {
    throw new Error('Iyzico not implemented');
  }

  parseWebhook(_payload: any): ParsedWebhook {
    throw new Error('Iyzico not implemented');
  }

  async refund(_providerId: string, _amountMinor: number): Promise<void> {
    throw new Error('Iyzico not implemented');
  }
}
