import { Module } from '@nestjs/common';
import { Body, Controller, HttpCode, Injectable, Post } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';

class SubscribeDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: 'Kaynak (landing, footer, vb.)' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  source?: string;
}

@Injectable()
export class SubscribersService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(email: string, source?: string) {
    await this.prisma.subscriber.upsert({
      where: { email },
      update: source ? { source } : {},
      create: { email, source },
    });
    return { ok: true };
  }
}

@ApiTags('subscribe')
@Controller()
export class SubscribersController {
  constructor(private readonly subscribers: SubscribersService) {}

  @Public()
  @Post('subscribe')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  subscribe(@Body() dto: SubscribeDto) {
    return this.subscribers.subscribe(dto.email, dto.source);
  }
}

@Module({
  controllers: [SubscribersController],
  providers: [SubscribersService],
})
export class SubscribersModule {}
