import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { SmsProvider } from './providers/sms.provider';
import { MockSmsProvider } from './providers/mock-sms.provider';
import { NetgsmProvider } from './providers/netgsm.provider';

@Injectable()
export class SmsService {
  private readonly providers: Map<string, SmsProvider>;

  constructor(
    private readonly settings: SettingsService,
    private readonly mock: MockSmsProvider,
    private readonly netgsm: NetgsmProvider,
  ) {
    this.providers = new Map<string, SmsProvider>([
      [mock.name, mock],
      [netgsm.name, netgsm],
    ]);
  }

  /** Aktif sağlayıcı: admin Ayarlar (sms.provider) → env → 'mock'. */
  private async provider(): Promise<SmsProvider> {
    const key =
      (await this.settings.get('sms.provider')) ||
      process.env.SMS_PROVIDER ||
      'mock';
    const p = this.providers.get(key);
    if (!p) throw new ServiceUnavailableException(`Bilinmeyen SMS sağlayıcı: ${key}`);
    return p;
  }

  async send(to: string, message: string): Promise<void> {
    const p = await this.provider();
    await p.send(to, message);
  }
}
