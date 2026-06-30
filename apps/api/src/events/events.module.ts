import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsAdminController } from './events.admin.controller';
import { EventsService } from './events.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [EventsController, EventsAdminController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
