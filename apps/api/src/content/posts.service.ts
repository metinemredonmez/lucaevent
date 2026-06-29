import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PostStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/content.dto';
import { slugify, rethrowSlugConflict } from './content.util';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- public ----
  listPublished(take = 50) {
    return this.prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
      take,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverUrl: true,
        publishedAt: true,
      },
    });
  }

  async getPublished(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug, status: PostStatus.PUBLISHED },
    });
    if (!post) throw new NotFoundException('Yazı bulunamadı.');
    return post;
  }

  // ---- admin ----
  adminList() {
    return this.prisma.post.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  async adminGet(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Yazı bulunamadı.');
    return post;
  }

  async create(dto: CreatePostDto) {
    const slug = dto.slug?.trim() || slugify(dto.title);
    const status = dto.status ?? PostStatus.DRAFT;
    try {
      return await this.prisma.post.create({
        data: {
          slug,
          title: dto.title.trim(),
          excerpt: dto.excerpt?.trim() || null,
          coverUrl: dto.coverUrl?.trim() || null,
          content: dto.content,
          status,
          publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
        },
      });
    } catch (e) {
      rethrowSlugConflict(e, slug);
    }
  }

  async update(id: string, dto: UpdatePostDto) {
    const existing = await this.adminGet(id);
    const data: Prisma.PostUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.slug !== undefined)
      data.slug = dto.slug.trim() || slugify(dto.title ?? existing.title);
    if (dto.excerpt !== undefined) data.excerpt = dto.excerpt?.trim() || null;
    if (dto.coverUrl !== undefined) data.coverUrl = dto.coverUrl?.trim() || null;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.status !== undefined) {
      data.status = dto.status;
      // İlk kez yayınlanırken publishedAt'i damgala.
      if (dto.status === PostStatus.PUBLISHED && !existing.publishedAt)
        data.publishedAt = new Date();
    }
    try {
      return await this.prisma.post.update({ where: { id }, data });
    } catch (e) {
      rethrowSlugConflict(e, dto.slug);
    }
  }

  async remove(id: string) {
    await this.adminGet(id);
    await this.prisma.post.delete({ where: { id } });
    return { ok: true };
  }
}
