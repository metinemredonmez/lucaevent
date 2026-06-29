import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

import { PaymentsService } from './payments.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('webhook')
  webhook(
    @Body() payload: any,
    @Headers() headers: Record<string, any>,
  ) {
    return this.payments.handleWebhook(payload, headers);
  }

  /**
   * Iyzico Checkout Form geri dönüşü — hosted ödeme sonrası Iyzico buraya
   * `token`'ı POST eder. Sonucu işleyip kullanıcıyı sonuç sayfasına yönlendiririz.
   */
  @Public()
  @Post('iyzico/callback')
  async iyzicoCallback(@Body() body: any, @Res() res: Response) {
    const webUrl = this.config.get<string>('WEB_URL') || 'http://localhost:3010';
    const token = body?.token || '';
    let durum = 'hata';
    try {
      const result = await this.payments.handleIyzicoCallback(token);
      durum = result.status === 'PAID' ? 'basarili' : 'basarisiz';
    } catch {
      durum = 'hata';
    }
    // Sipariş kodu redirect URL'ine konmaz (tarayıcı geçmişi/log/referer sızıntısı).
    res.redirect(303, `${webUrl}/odeme/sonuc?durum=${durum}`);
  }

  // DEV helper to simulate a PAID provider webhook.
  @Public()
  @Post('mock/pay/:code')
  mockPay(@Param('code') code: string) {
    return this.payments.mockPay(code);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Post(':code/refund')
  refund(@Param('code') code: string) {
    return this.payments.refund(code);
  }
}
