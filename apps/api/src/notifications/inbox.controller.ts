import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';

/** Üyenin uygulama-içi bildirim merkezi (çan). Herhangi bir giriş yapmış kullanıcı. */
@ApiTags('me/notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/notifications')
export class InboxController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.notifications.listForUser(user.sub);
  }

  @Get('unread-count')
  async unread(@CurrentUser() user: CurrentUserPayload) {
    return { count: await this.notifications.unreadCount(user.sub) };
  }

  @Post('read')
  read(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { ids?: string[] },
  ) {
    return this.notifications.markRead(user.sub, body?.ids);
  }
}
