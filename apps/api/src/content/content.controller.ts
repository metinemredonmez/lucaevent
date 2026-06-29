import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { PostsService } from './posts.service';
import { PagesService } from './pages.service';
import {
  CreatePageDto,
  CreatePostDto,
  UpdatePageDto,
  UpdatePostDto,
} from './dto/content.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

/** Public — yayınlanan blog yazıları ve içerik sayfaları. */
@ApiTags('content')
@Controller()
export class ContentPublicController {
  constructor(
    private readonly posts: PostsService,
    private readonly pages: PagesService,
  ) {}

  @Public()
  @Get('posts')
  listPosts(@Query('take') take?: string) {
    return this.posts.listPublished(take ? Number(take) : 50);
  }

  @Public()
  @Get('posts/:slug')
  getPost(@Param('slug') slug: string) {
    return this.posts.getPublished(slug);
  }

  @Public()
  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) {
    return this.pages.getPublished(slug);
  }
}

/** Admin — blog yazıları + içerik sayfaları yönetimi. */
@ApiTags('admin/content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN, Role.EDITOR)
@Controller('admin')
export class ContentAdminController {
  constructor(
    private readonly posts: PostsService,
    private readonly pages: PagesService,
  ) {}

  // ---- blog yazıları ----
  @Get('posts')
  listPosts() {
    return this.posts.adminList();
  }

  @Get('posts/:id')
  getPost(@Param('id') id: string) {
    return this.posts.adminGet(id);
  }

  @Post('posts')
  createPost(@Body() dto: CreatePostDto) {
    return this.posts.create(dto);
  }

  @Patch('posts/:id')
  updatePost(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.posts.update(id, dto);
  }

  @Delete('posts/:id')
  deletePost(@Param('id') id: string) {
    return this.posts.remove(id);
  }

  // ---- içerik sayfaları ----
  @Get('pages')
  listPages() {
    return this.pages.adminList();
  }

  @Get('pages/:id')
  getPage(@Param('id') id: string) {
    return this.pages.adminGet(id);
  }

  @Post('pages')
  createPage(@Body() dto: CreatePageDto) {
    return this.pages.create(dto);
  }

  @Patch('pages/:id')
  updatePage(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.pages.update(id, dto);
  }

  @Delete('pages/:id')
  deletePage(@Param('id') id: string) {
    return this.pages.remove(id);
  }
}
