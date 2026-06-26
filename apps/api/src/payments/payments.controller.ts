import { Body, Controller, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { PaymentsService } from './payments.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Post('webhook')
  webhook(
    @Body() payload: any,
    @Headers() headers: Record<string, any>,
  ) {
    return this.payments.handleWebhook(payload, headers);
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
