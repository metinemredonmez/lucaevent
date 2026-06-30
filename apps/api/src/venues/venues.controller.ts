import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { VenuesService } from './venues.service';
import { VenueCreateDto, VenueUpdateDto } from './dto/venue.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('venues')
@Controller()
export class VenuesController {
  constructor(private readonly venues: VenuesService) {}

  // public
  @Public()
  @Get('venues')
  list() {
    return this.venues.list();
  }

  // public harita config (Mapbox token) — auth gerekmez
  @Public()
  @Get('maps/config')
  mapsConfig() {
    return this.venues.mapsConfig();
  }

  @Public()
  @Get('venues/:slug')
  bySlug(@Param('slug') slug: string) {
    return this.venues.bySlug(slug);
  }

  // admin
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Get('admin/venues')
  listAdmin() {
    return this.venues.listAdmin();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Get('admin/venues/:id')
  byId(@Param('id') id: string) {
    return this.venues.byId(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Post('admin/venues')
  create(@Body() dto: VenueCreateDto) {
    return this.venues.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Patch('admin/venues/:id')
  update(@Param('id') id: string, @Body() dto: VenueUpdateDto) {
    return this.venues.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Delete('admin/venues/:id')
  remove(@Param('id') id: string) {
    return this.venues.remove(id);
  }
}
