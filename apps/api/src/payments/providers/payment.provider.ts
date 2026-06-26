import { Order } from '@prisma/client';

export interface CheckoutResult {
  checkoutUrl: string;
  providerId: string;
}

export interface ParsedWebhook {
  orderCode: string;
  status: 'PAID' | 'FAILED';
}

export interface PaymentProvider {
  readonly name: string;
  createCheckout(order: Order): Promise<CheckoutResult>;
  verifyWebhook(payload: any, headers: Record<string, any>): boolean;
  parseWebhook(payload: any): ParsedWebhook;
  refund(providerId: string, amountMinor: number): Promise<void>;
}

export const PAYMENT_PROVIDERS = 'PAYMENT_PROVIDERS';
