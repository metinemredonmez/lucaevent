import { Body, Controller, Get, Ip, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/booking.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';

@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Public()
  @Post('bookings')
  create(@Body() dto: CreateBookingDto, @Ip() ip: string) {
    return this.bookings.create(dto, ip);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/bookings')
  myBookings(@CurrentUser() user: CurrentUserPayload) {
    return this.bookings.myBookings(user.sub, user.email);
  }

  @Public()
  @Get('bookings/:code')
  byCode(@Param('code') code: string) {
    return this.bookings.byCode(code);
  }
}
