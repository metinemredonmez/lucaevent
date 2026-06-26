import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockProvider } from './providers/mock.provider';
import { IyzicoProvider } from './providers/iyzico.provider';
import { NotificationsModule } from '../notifications/notifications.module';
import { WaitlistModule } from '../waitlist/waitlist.module';

@Module({
  imports: [NotificationsModule, WaitlistModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MockProvider, IyzicoProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
