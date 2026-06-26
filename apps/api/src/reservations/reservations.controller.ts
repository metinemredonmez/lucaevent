import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { ReservationsService } from './reservations.service';
import { ReservationCreateDto, ReservationQueryDto } from './dto/reservation.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('reservations')
@Controller()
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  // public
  @Public()
  @Post('reservations')
  create(@Body() dto: ReservationCreateDto) {
    return this.reservations.create(dto);
  }

  // admin
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Get('admin/reservations')
  list(@Query() q: ReservationQueryDto) {
    return this.reservations.list(q);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Post('admin/reservations/:id/confirm')
  confirm(@Param('id') id: string) {
    return this.reservations.confirm(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Post('admin/reservations/:id/cancel')
  cancel(@Param('id') id: string) {
    return this.reservations.cancel(id);
  }
}
