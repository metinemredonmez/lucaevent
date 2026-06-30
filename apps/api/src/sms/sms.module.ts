import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { OtpService } from './otp.service';
import { SmsController } from './sms.controller';
import { MockSmsProvider } from './providers/mock-sms.provider';
import { NetgsmProvider } from './providers/netgsm.provider';

@Module({
  controllers: [SmsController],
  providers: [SmsService, OtpService, MockSmsProvider, NetgsmProvider],
  exports: [SmsService],
})
export class SmsModule {}
