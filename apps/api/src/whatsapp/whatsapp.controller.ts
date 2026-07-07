import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';

import { WhatsappService } from './whatsapp.service';
import { InboundQueryDto, InboundWhatsappDto, UpdateInboundDto } from './dto/whatsapp.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('whatsapp')
@Controller()
export class WhatsappController {
  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly config: ConfigService,
  ) {}

  /**
   * wa-listener → gelen mesaj. JWT değil, shared secret (x-wa-secret) ile korunur.
   * WA_WEBHOOK_SECRET boşsa (dev) korumasız kabul edilir.
   */
  @Public()
  @Post('webhooks/whatsapp/inbound')
  ingest(@Body() dto: InboundWhatsappDto, @Headers('x-wa-secret') secret?: string) {
    const expected = this.config.get<string>('WA_WEBHOOK_SECRET');
    if (expected && secret !== expected) throw new ForbiddenException('Geçersiz webhook secret');
    return this.whatsapp.ingest(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Get('admin/whatsapp')
  list(@Query() q: InboundQueryDto) {
    return this.whatsapp.list(q);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Get('admin/whatsapp/:id')
  get(@Param('id') id: string) {
    return this.whatsapp.get(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Patch('admin/whatsapp/:id')
  update(@Param('id') id: string, @Body() dto: UpdateInboundDto) {
    return this.whatsapp.update(id, dto);
  }

  /** Onayla → DRAFT etkinlik oluştur. */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Post('admin/whatsapp/:id/convert')
  convert(@Param('id') id: string) {
    return this.whatsapp.convert(id);
  }
}
