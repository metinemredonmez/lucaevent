import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';

import { VenuesService } from './venues.service';
import { PlacesService } from './places.service';
import { VenueCreateDto, VenueUpdateDto } from './dto/venue.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('venues')
@Controller()
export class VenuesController {
  constructor(
    private readonly venues: VenuesService,
    private readonly places: PlacesService,
  ) {}

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

  // public harita — konumlu mekanlar + durum (':slug'tan ÖNCE olmalı)
  @Public()
  @Get('venues/map')
  map() {
    return this.venues.mapVenues();
  }

  // Google foto proxy (key gizli) — ':slug'tan ÖNCE olmalı
  @Public()
  @Get('venues/place-photo')
  async placePhoto(@Query('ref') ref: string, @Res() res: Response) {
    const img = ref ? await this.places.fetchPhoto(ref).catch(() => null) : null;
    if (!img) {
      res.status(404).end();
      return;
    }
    res.set('Content-Type', img.contentType);
    res.set('Cache-Control', 'public, max-age=604800, immutable');
    res.end(Buffer.from(img.body));
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
