import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryCreateDto, CategoryUpdateDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
  }

  async bySlug(slug: string) {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CategoryCreateDto) {
    try {
      return await this.prisma.category.create({ data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Category slug already exists');
      }
      throw e;
    }
  }

  async update(id: string, dto: CategoryUpdateDto) {
    try {
      return await this.prisma.category.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException('Category not found');
        if (e.code === 'P2002') throw new ConflictException('Category slug already exists');
      }
      throw e;
    }
  }

  async remove(id: string) {
    // The Event.category relation is SET NULL on delete, so a raw delete would
    // SILENTLY orphan events (categoryId -> null). Block it explicitly with a
    // pre-check so admins get a clear 409 instead of surprise un-categorization.
    const linked = await this.prisma.event.count({ where: { categoryId: id } });
    if (linked > 0) {
      throw new ConflictException(
        `Category has ${linked} event(s); reassign or remove them first`,
      );
    }
    try {
      return await this.prisma.category.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Category not found');
      }
      throw e;
    }
  }
}
