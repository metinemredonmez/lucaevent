import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { OtpService } from './otp.service';
import { SendOtpDto, VerifyOtpDto } from './dto/sms.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('sms')
@Controller('sms')
export class SmsController {
  constructor(private readonly otp: OtpService) {}

  @Public()
  @Post('otp/send')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  send(@Body() dto: SendOtpDto) {
    return this.otp.send(dto.phone);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  verify(@Body() dto: VerifyOtpDto) {
    return this.otp.verify(dto.phone, dto.code);
  }
}
