import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

// Global so auth (and later bookings/notifications) can inject MailService.
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
