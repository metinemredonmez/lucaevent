import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './sms.service';
import { normalizePhone } from './providers/sms.provider';

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
  ) {}

  private hash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  async send(phoneInput: string): Promise<{ ok: true; expiresInSec: number }> {
    const phone = normalizePhone(phoneInput);
    if (!phone) throw new BadRequestException('Geçersiz telefon numarası.');

    // Resend cooldown: son 60 sn içinde gönderim varsa engelle (spam/maliyet).
    const recent = await this.prisma.phoneOtp.findFirst({
      where: { phone, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      throw new BadRequestException('Çok sık deneme — lütfen biraz bekleyin.');
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.prisma.phoneOtp.create({
      data: {
        phone,
        codeHash: this.hash(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
    await this.sms.send(
      phone,
      `Luca dogrulama kodun: ${code}. Kod 5 dakika gecerlidir.`,
    );
    return { ok: true, expiresInSec: OTP_TTL_MS / 1000 };
  }

  async verify(phoneInput: string, code: string): Promise<{ ok: true }> {
    const phone = normalizePhone(phoneInput);
    if (!phone) throw new BadRequestException('Geçersiz telefon numarası.');

    const otp = await this.prisma.phoneOtp.findFirst({
      where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new BadRequestException('Kod geçersiz veya süresi dolmuş.');
    if (otp.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('Çok fazla hatalı deneme — yeni kod isteyin.');
    }

    if (otp.codeHash !== this.hash(code)) {
      await this.prisma.phoneOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Kod hatalı.');
    }

    await this.prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });
    return { ok: true };
  }
}
