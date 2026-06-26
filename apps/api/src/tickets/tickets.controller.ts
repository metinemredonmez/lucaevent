import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { TicketsService } from './tickets.service';
import { CheckInDto } from './dto/checkin.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';

@ApiTags('tickets')
@Controller()
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/tickets')
  myTickets(@CurrentUser() user: CurrentUserPayload) {
    return this.tickets.myTickets(user.sub, user.email);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.DOOR)
  @Post('tickets/check-in')
  checkIn(
    @Body() dto: CheckInDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tickets.checkIn(dto.code, user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR, Role.DOOR)
  @Get('admin/events/:id/attendees')
  attendees(@Param('id') id: string) {
    return this.tickets.attendees(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Header('Content-Type', 'text/csv')
  @Get('admin/events/:id/attendees.csv')
  attendeesCsv(@Param('id') id: string) {
    return this.tickets.attendeesCsv(id);
  }
}
