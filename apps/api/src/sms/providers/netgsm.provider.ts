import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from './sms.provider';
import { SettingsService } from '../../settings/settings.service';

/** Netgsm HTTP API (GET). Kimlikler admin Ayarlar'dan okunur. */
@Injectable()
export class NetgsmProvider implements SmsProvider {
  readonly name = 'netgsm';
  private readonly logger = new Logger('Netgsm');

  constructor(private readonly settings: SettingsService) {}

  async send(to: string, message: string): Promise<void> {
    const [usercode, password, header] = await Promise.all([
      this.settings.get('sms.netgsm.usercode'),
      this.settings.get('sms.netgsm.password'),
      this.settings.get('sms.sender'),
    ]);
    if (!usercode || !password || !header) {
      throw new Error('Netgsm ayarları eksik — Ayarlar → SMS bölümünden girin.');
    }

    const params = new URLSearchParams({
      usercode,
      password,
      gsmno: to,
      message,
      msgheader: header,
    });
    const res = await fetch(
      `https://api.netgsm.com.tr/sms/send/get/?${params.toString()}`,
    );
    const body = (await res.text()).trim();
    // Netgsm: "00 jobid" / "01 jobid" / "02 jobid" = başarı; aksi hata kodu.
    const code = body.split(/\s+/)[0];
    if (!['00', '01', '02'].includes(code)) {
      this.logger.error(`Netgsm gönderim hatası (code=${code})`);
      throw new Error('SMS gönderilemedi.');
    }
  }
}
