import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { ArtistsService } from './artists.service';
import { ArtistCreateDto, ArtistUpdateDto } from './dto/artist.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('artists')
@Controller()
export class ArtistsController {
  constructor(private readonly artists: ArtistsService) {}

  // public
  @Public()
  @Get('artists')
  list(@Query('residents') residents?: string) {
    return this.artists.list(residents === 'true');
  }

  @Public()
  @Get('artists/:slug')
  bySlug(@Param('slug') slug: string) {
    return this.artists.bySlug(slug);
  }

  // admin
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Get('admin/artists/:id')
  byId(@Param('id') id: string) {
    return this.artists.byId(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Post('admin/artists')
  create(@Body() dto: ArtistCreateDto) {
    return this.artists.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
  @Patch('admin/artists/:id')
  update(@Param('id') id: string, @Body() dto: ArtistUpdateDto) {
    return this.artists.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Delete('admin/artists/:id')
  remove(@Param('id') id: string) {
    return this.artists.remove(id);
  }
}
