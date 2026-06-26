import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { CategoriesService } from './categories.service';
import { CategoryCreateDto, CategoryUpdateDto } from './dto/category.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('categories')
@Controller()
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  // public
  @Public()
  @Get('categories')
  list() {
    return this.categories.list();
  }

  @Public()
  @Get('categories/:slug')
  bySlug(@Param('slug') slug: string) {
    return this.categories.bySlug(slug);
  }

  // admin
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Post('admin/categories')
  create(@Body() dto: CategoryCreateDto) {
    return this.categories.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Patch('admin/categories/:id')
  update(@Param('id') id: string, @Body() dto: CategoryUpdateDto) {
    return this.categories.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @Delete('admin/categories/:id')
  remove(@Param('id') id: string) {
    return this.categories.remove(id);
  }
}
