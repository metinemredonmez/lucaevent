import { Injectable, NotFoundException } from '@nestjs/common';
import { CollectionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { slugify, rethrowSlugConflict } from '../content/content.util';
import {
  AddCollectionItemsDto,
  CreateCollectionDto,
  ReorderCollectionItemsDto,
  UpdateCollectionDto,
} from './dto/collection.dto';
import { fetchYoutubeMeta } from './youtube.util';

const ITEM_SELECT = {
  id: true,
  url: true,
  videoId: true,
  title: true,
  author: true,
  thumbUrl: true,
  sort: true,
} satisfies Prisma.CollectionItemSelect;

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- public ----
  /**
   * Yayınlanan koleksiyonlar + videoları (ana sayfa şeridi). Boş koleksiyon gösterilmez.
   * LIFO: sort eşitse (varsayılan) en son oluşturulan en üstte; sort ile manuel override.
   */
  async listPublished() {
    const rows = await this.prisma.collection.findMany({
      where: { status: CollectionStatus.PUBLISHED },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        layout: true,
        items: { orderBy: { sort: 'asc' }, select: ITEM_SELECT },
      },
    });
    return rows.filter((c) => c.items.length > 0);
  }

  // ---- admin ----
  adminList() {
    return this.prisma.collection.findMany({
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      include: {
        items: { orderBy: { sort: 'asc' }, select: ITEM_SELECT },
      },
    });
  }

  async adminGet(id: string) {
    const c = await this.prisma.collection.findUnique({
      where: { id },
      include: { items: { orderBy: { sort: 'asc' }, select: ITEM_SELECT } },
    });
    if (!c) throw new NotFoundException('Koleksiyon bulunamadı.');
    return c;
  }

  async create(dto: CreateCollectionDto) {
    const slug = dto.slug?.trim() || slugify(dto.title);
    try {
      return await this.prisma.collection.create({
        data: {
          slug,
          title: dto.title.trim(),
          subtitle: dto.subtitle?.trim() || null,
          status: dto.status ?? CollectionStatus.DRAFT,
          layout: dto.layout ?? 'cinema',
          sort: dto.sort ?? 0,
        },
        include: { items: true },
      });
    } catch (e) {
      rethrowSlugConflict(e, slug);
    }
  }

  async update(id: string, dto: UpdateCollectionDto) {
    const existing = await this.adminGet(id);
    const data: Prisma.CollectionUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.slug !== undefined)
      data.slug = dto.slug.trim() || slugify(dto.title ?? existing.title);
    if (dto.subtitle !== undefined) data.subtitle = dto.subtitle?.trim() || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.layout !== undefined) data.layout = dto.layout;
    if (dto.sort !== undefined) data.sort = dto.sort;
    try {
      return await this.prisma.collection.update({
        where: { id },
        data,
        include: { items: { orderBy: { sort: 'asc' }, select: ITEM_SELECT } },
      });
    } catch (e) {
      rethrowSlugConflict(e, dto.slug);
    }
  }

  async remove(id: string) {
    await this.adminGet(id);
    await this.prisma.collection.delete({ where: { id } }); // item'lar cascade
    return { ok: true };
  }

  /**
   * URL'leri koleksiyona ekler. Başlık/kanal/kapak oEmbed'den doldurulur;
   * aynı video zaten varsa atlanır. Sıra mevcut son item'ın ardından devam eder.
   */
  async addItems(collectionId: string, dto: AddCollectionItemsDto) {
    const collection = await this.adminGet(collectionId);
    const urls = dto.urls.map((u) => u.trim()).filter(Boolean);
    const existing = new Set(collection.items.map((i) => i.videoId));
    let sort = collection.items.reduce((m, i) => Math.max(m, i.sort), -1) + 1;

    const metas = await Promise.all(urls.map((u) => fetchYoutubeMeta(u)));
    for (const m of metas) {
      if (existing.has(m.videoId)) continue; // aynı video iki kez eklenmesin
      existing.add(m.videoId);
      await this.prisma.collectionItem.create({
        data: {
          collectionId,
          url: m.url,
          videoId: m.videoId,
          title: m.title,
          author: m.author,
          thumbUrl: m.thumbUrl,
          sort: sort++,
        },
      });
    }
    return this.adminGet(collectionId);
  }

  async removeItem(collectionId: string, itemId: string) {
    const item = await this.prisma.collectionItem.findFirst({
      where: { id: itemId, collectionId },
    });
    if (!item) throw new NotFoundException('Video bulunamadı.');
    await this.prisma.collectionItem.delete({ where: { id: itemId } });
    return this.adminGet(collectionId);
  }

  /** Sürükle-bırak sonrası yeni sıra — gönderilen id dizisi 0..n olarak damgalanır. */
  async reorderItems(collectionId: string, dto: ReorderCollectionItemsDto) {
    const collection = await this.adminGet(collectionId);
    const own = new Set(collection.items.map((i) => i.id));
    const ids = dto.ids.filter((id) => own.has(id));
    await this.prisma.$transaction(
      ids.map((id, i) =>
        this.prisma.collectionItem.update({ where: { id }, data: { sort: i } }),
      ),
    );
    return this.adminGet(collectionId);
  }
}
