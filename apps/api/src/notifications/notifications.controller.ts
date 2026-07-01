import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { NotificationsService } from './notifications.service';
import { BroadcastDto, DispatchDto, SendToUsersDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin/notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN)
@Controller('admin/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('status')
  async status() {
    return { configured: await this.notifications.isConfigured() };
  }

  @Post('broadcast')
  broadcast(@Body() dto: BroadcastDto) {
    return this.notifications.broadcast(dto.title, dto.message, {
      url: dto.url,
      segment: dto.segment,
    });
  }

  @Post('send')
  send(@Body() dto: SendToUsersDto) {
    return this.notifications.sendToUsers(dto.userIds, dto.title, dto.message, {
      url: dto.url,
    });
  }

  // detaylı gönderim: hedef (herkes/etkinlik) + kanal (uygulama-içi/push)
  @Post('dispatch')
  dispatch(@Body() dto: DispatchDto) {
    return this.notifications.dispatch({
      title: dto.title,
      message: dto.message,
      url: dto.url,
      target: dto.target,
      eventId: dto.eventId,
      inapp: dto.inapp,
      push: dto.push,
    });
  }
}
