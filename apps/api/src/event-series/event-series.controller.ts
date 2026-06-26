import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { EventSeriesService } from './event-series.service';
import { CreateEventSeriesDto, GenerateDto } from './dto/event-series.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin/event-series')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
@Controller('admin/event-series')
export class EventSeriesController {
  constructor(private readonly series: EventSeriesService) {}

  @Get()
  list() {
    return this.series.list();
  }

  @Get(':id')
  one(@Param('id') id: string) {
    return this.series.byId(id);
  }

  @Post()
  create(@Body() dto: CreateEventSeriesDto) {
    return this.series.create(dto);
  }

  @Post(':id/generate')
  generate(@Param('id') id: string, @Body() dto: GenerateDto) {
    return this.series.generate(id, dto.until);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.series.remove(id);
  }
}
