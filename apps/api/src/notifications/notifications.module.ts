import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsPublicController } from './notifications.public.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController, NotificationsPublicController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
