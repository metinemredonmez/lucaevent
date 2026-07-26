import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { CollectionsService } from './collections.service';
import {
  AddCollectionItemsDto,
  CreateCollectionDto,
  ReorderCollectionItemsDto,
  UpdateCollectionDto,
} from './dto/collection.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

/** Public — ana sayfadaki yayınlanan video koleksiyonları. */
@ApiTags('collections')
@Controller('collections')
export class CollectionsPublicController {
  constructor(private readonly collections: CollectionsService) {}

  @Public()
  @Get()
  list() {
    return this.collections.listPublished();
  }
}

/** Admin — koleksiyon ve içindeki videoların yönetimi. */
@ApiTags('admin/collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
@Controller('admin/collections')
export class CollectionsAdminController {
  constructor(private readonly collections: CollectionsService) {}

  @Get()
  list() {
    return this.collections.adminList();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.collections.adminGet(id);
  }

  @Post()
  create(@Body() dto: CreateCollectionDto) {
    return this.collections.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.collections.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collections.remove(id);
  }

  @Post(':id/items')
  addItems(@Param('id') id: string, @Body() dto: AddCollectionItemsDto) {
    return this.collections.addItems(id, dto);
  }

  @Patch(':id/items/order')
  reorderItems(
    @Param('id') id: string,
    @Body() dto: ReorderCollectionItemsDto,
  ) {
    return this.collections.reorderItems(id, dto);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.collections.removeItem(id, itemId);
  }
}
