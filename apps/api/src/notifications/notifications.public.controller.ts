import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { NotificationsService } from './notifications.service';
import { Public } from '../common/decorators/public.decorator';

/** Auth gerektirmeyen public push config — frontend web-push SDK init için. */
@ApiTags('push')
@Controller('push')
export class NotificationsPublicController {
  constructor(private readonly notifications: NotificationsService) {}

  @Public()
  @Get('config')
  config() {
    return this.notifications.publicConfig();
  }
}
