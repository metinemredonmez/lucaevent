import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Role } from '@prisma/client';

import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

class SweepDto {
  @ApiPropertyOptional({ description: 'TTL dk (test için 0 = tüm PENDING)', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  ttlMinutes?: number;
}

@ApiTags('admin/jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN)
@Controller('admin/jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Post('abandoned-sweep')
  abandoned(@Body() dto: SweepDto) {
    return this.jobs.sweepAbandonedOrders(dto.ttlMinutes);
  }

  @Post('reminders')
  reminders() {
    return this.jobs.sweepReminders();
  }
}
