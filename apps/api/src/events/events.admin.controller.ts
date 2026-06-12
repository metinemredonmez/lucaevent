import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { EventsService } from './events.service';
import { EventCreateDto, EventQueryDto, EventUpdateDto } from './dto/event.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin/events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
@Controller('admin/events')
export class EventsAdminController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(@Query() q: EventQueryDto) {
    return this.events.listAll(q);
  }

  @Get(':id')
  one(@Param('id') id: string) {
    return this.events.byId(id);
  }

  @Post()
  create(@Body() dto: EventCreateDto) {
    return this.events.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: EventUpdateDto) {
    return this.events.update(id, dto);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.events.publish(id);
  }

  @Post(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.events.unpublish(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.events.remove(id);
  }
}
