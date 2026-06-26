import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

// Optional dependency: nodemailer is used when installed; otherwise we LOG the
// email (dev). Install with `pnpm --filter @luca/api add nodemailer` when the
// registry is reachable — no code change needed to activate real SMTP.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nodemailer: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  nodemailer = require('nodemailer');
} catch {
  /* not installed — falls back to log transport */
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly settings: SettingsService) {}

  private async smtpConfig() {
    const [host, port, user, password, from] = await Promise.all([
      this.settings.get('mail.smtp.host'),
      this.settings.get('mail.smtp.port'),
      this.settings.get('mail.smtp.user'),
      this.settings.get('mail.smtp.password'),
      this.settings.get('mail.from'),
    ]);
    return {
      host,
      port: Number(port) || 587,
      user,
      password,
      from: from || 'Luca <no-reply@luca.club>',
    };
  }

  async sendMail(msg: MailMessage): Promise<{ ok: boolean; transport: string }> {
    const cfg = await this.smtpConfig();
    const canSmtp = nodemailer && cfg.host && cfg.user && cfg.password;

    if (!canSmtp) {
      // In production, NEVER log the body — reset/verify links carry one-time
      // tokens and would enable account takeover from log access. Metadata only.
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(
          `[mail] SMTP not configured — dropped "${msg.subject}" to ${msg.to}`,
        );
        return { ok: false, transport: 'none' };
      }
      // dev: log full body so action links/tokens are visible for testing
      this.logger.warn(
        `[mail:log] → ${msg.to} | ${msg.subject}\n${msg.text ?? this.stripHtml(msg.html)}`,
      );
      return { ok: true, transport: 'log' };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.port === 465, // 465 = implicit TLS; 587 = STARTTLS
        auth: { user: cfg.user, pass: cfg.password },
      });
      await transporter.sendMail({
        from: cfg.from,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text ?? this.stripHtml(msg.html),
      });
      return { ok: true, transport: 'smtp' };
    } catch (e) {
      // never throw — auth flow must not 500 because mail is down
      this.logger.error(`SMTP send failed: ${(e as Error).message}`);
      return { ok: false, transport: 'smtp' };
    }
  }

  sendVerificationEmail(to: string, name: string | null, link: string) {
    return this.sendMail({
      to,
      subject: 'Luca — E-postanı doğrula',
      html: this.template(
        `Merhaba${name ? ' ' + name : ''},`,
        'Hesabını doğrulamak için aşağıdaki butona tıkla.',
        'E-postamı doğrula',
        link,
        'Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.',
      ),
    });
  }

  sendPasswordResetEmail(to: string, name: string | null, link: string) {
    return this.sendMail({
      to,
      subject: 'Luca — Şifre sıfırlama',
      html: this.template(
        `Merhaba${name ? ' ' + name : ''},`,
        'Şifreni sıfırlamak için aşağıdaki butona tıkla. Bağlantı 1 saat geçerli.',
        'Şifremi sıfırla',
        link,
        'Bu isteği sen yapmadıysan şifren değişmez; bu e-postayı yok sayabilirsin.',
      ),
    });
  }

  sendOrderConfirmation(
    to: string,
    name: string | null,
    eventTitle: string,
    orderCode: string,
    ticketCount: number,
    whenText: string,
    link: string,
  ) {
    return this.sendMail({
      to,
      subject: `Luca — Biletin hazır: ${eventTitle}`,
      html: this.template(
        `Merhaba${name ? ' ' + name : ''},`,
        `<b>${eventTitle}</b> için <b>${ticketCount}</b> biletin onaylandı.<br/>Tarih: ${whenText}<br/>Sipariş kodu: <b>${orderCode}</b>`,
        'Biletlerimi gör',
        link,
        'Görüşmek üzere! 🧡',
      ),
    });
  }

  sendEventReminder(
    to: string,
    name: string | null,
    eventTitle: string,
    whenText: string,
    link: string,
  ) {
    return this.sendMail({
      to,
      subject: `Luca — Yaklaşıyor: ${eventTitle}`,
      html: this.template(
        `Merhaba${name ? ' ' + name : ''},`,
        `<b>${eventTitle}</b> yakında! Tarih: ${whenText}. Biletini hazır bulundur.`,
        'Etkinlik detayı',
        link,
        'Görüşmek üzere! 🧡',
      ),
    });
  }

  sendEventCanceled(to: string, name: string | null, eventTitle: string) {
    const link = `${process.env.WEB_URL ?? ''}/events`;
    return this.sendMail({
      to,
      subject: `Luca — Etkinlik iptal edildi: ${eventTitle}`,
      html: this.template(
        `Merhaba${name ? ' ' + name : ''},`,
        `Maalesef <b>${eventTitle}</b> iptal edildi. Ödemen iade ediliyor. Anlayışın için teşekkürler.`,
        'Diğer etkinlikleri keşfet',
        link,
        'Yakında görüşmek üzere. 🧡',
      ),
    });
  }

  sendWaitlistOpening(
    to: string,
    name: string | null,
    eventTitle: string,
    link: string,
  ) {
    return this.sendMail({
      to,
      subject: `Luca — Yer açıldı: ${eventTitle}`,
      html: this.template(
        `Merhaba${name ? ' ' + name : ''},`,
        `<b>${eventTitle}</b> için bekleme listenden <b>yer açıldı</b>! İlk gelen kapar — hemen rezerve et.`,
        'Hemen rezerve et',
        link,
        'Görüşmek üzere! 🧡',
      ),
    });
  }

  private template(
    greeting: string,
    body: string,
    cta: string,
    link: string,
    footer: string,
  ): string {
    return `<div style="font-family:Manrope,Arial,sans-serif;max-width:480px;margin:0 auto;color:#171717">
  <h2 style="font-family:'Cormorant Garamond',Georgia,serif">Luca</h2>
  <p>${greeting}</p>
  <p>${body}</p>
  <p style="margin:24px 0"><a href="${link}" style="background:#C86B42;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;display:inline-block">${cta}</a></p>
  <p style="font-size:13px;color:#6F6F6F;word-break:break-all">${link}</p>
  <hr style="border:none;border-top:1px solid #E3DED5"/>
  <p style="font-size:12px;color:#6F6F6F">${footer}</p>
</div>`;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
