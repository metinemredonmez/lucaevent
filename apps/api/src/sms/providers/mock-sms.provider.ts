import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SmsProvider } from './sms.provider';

/** DEV: SMS'i loglar. Prod'da fail-closed (gerçek sağlayıcı zorunlu). */
@Injectable()
export class MockSmsProvider implements SmsProvider {
  readonly name = 'mock';
  private readonly logger = new Logger('MockSms');

  async send(to: string, message: string): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException('SMS sağlayıcı ayarlı değil.');
    }
    this.logger.warn(`[SMS -> ${to}] ${message}`);
  }
}
