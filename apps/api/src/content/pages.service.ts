import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto, UpdatePageDto } from './dto/content.dto';
import { slugify, rethrowSlugConflict } from './content.util';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- public ----
  async getPublished(slug: string) {
    const page = await this.prisma.page.findFirst({
      where: { slug, isPublished: true },
    });
    if (!page) throw new NotFoundException('Sayfa bulunamadı.');
    return page;
  }

  // ---- admin ----
  adminList() {
    return this.prisma.page.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  async adminGet(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Sayfa bulunamadı.');
    return page;
  }

  async create(dto: CreatePageDto) {
    const slug = dto.slug?.trim() || slugify(dto.title);
    try {
      return await this.prisma.page.create({
        data: {
          slug,
          title: dto.title.trim(),
          excerpt: dto.excerpt?.trim() || null,
          content: dto.content,
          isPublished: dto.isPublished ?? true,
        },
      });
    } catch (e) {
      rethrowSlugConflict(e, slug);
    }
  }

  async update(id: string, dto: UpdatePageDto) {
    const existing = await this.adminGet(id);
    const data: Prisma.PageUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.slug !== undefined)
      data.slug = dto.slug.trim() || slugify(dto.title ?? existing.title);
    if (dto.excerpt !== undefined) data.excerpt = dto.excerpt?.trim() || null;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.isPublished !== undefined) data.isPublished = dto.isPublished;
    try {
      return await this.prisma.page.update({ where: { id }, data });
    } catch (e) {
      rethrowSlugConflict(e, dto.slug);
    }
  }

  async remove(id: string) {
    await this.adminGet(id);
    await this.prisma.page.delete({ where: { id } });
    return { ok: true };
  }
}
