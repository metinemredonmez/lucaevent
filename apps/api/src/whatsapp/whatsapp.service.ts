import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventStatus, Prisma, WaInboundStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappParseService, ParsedEvent } from './parse.service';
import { slugify } from '../content/content.util';
import { InboundQueryDto, InboundWhatsappDto, UpdateInboundDto } from './dto/whatsapp.dto';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: WhatsappParseService,
  ) {}

  /** wa-listener'dan gelen mesaj. waMessageId ile idempotent — tekrar gelirse mevcut kaydı döner. */
  async ingest(dto: InboundWhatsappDto) {
    const existing = await this.prisma.whatsappInbound.findUnique({
      where: { waMessageId: dto.waMessageId },
    });
    if (existing) return { id: existing.id, status: existing.status, duplicate: true };

    const created = await this.prisma.whatsappInbound.create({
      data: {
        waMessageId: dto.waMessageId,
        rawText: dto.text,
        groupName: dto.groupName,
        sender: dto.sender,
        mediaUrls: dto.mediaUrls ?? [],
      },
    });

    // Parse (Claude/regex) — hata olursa kayıt FAILED, akış bloklanmaz.
    try {
      const parsed = await this.parser.parse(dto.text);
      await this.prisma.whatsappInbound.update({
        where: { id: created.id },
        data: { parsed: parsed as unknown as Prisma.InputJsonValue, status: WaInboundStatus.PARSED },
      });
      return { id: created.id, status: WaInboundStatus.PARSED, duplicate: false };
    } catch (e) {
      this.logger.error(`Parse hatası (${created.id}): ${(e as Error).message}`);
      await this.prisma.whatsappInbound.update({
        where: { id: created.id },
        data: { status: WaInboundStatus.FAILED, parseError: (e as Error).message.slice(0, 500) },
      });
      return { id: created.id, status: WaInboundStatus.FAILED, duplicate: false };
    }
  }

  list(q: InboundQueryDto) {
    return this.prisma.whatsappInbound.findMany({
      where: { status: q.status },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async get(id: string) {
    const row = await this.prisma.whatsappInbound.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Kayıt bulunamadı');
    return row;
  }

  async update(id: string, dto: UpdateInboundDto) {
    const row = await this.get(id);
    const merged =
      dto.parsed !== undefined
        ? { ...(row.parsed as object | null), ...dto.parsed }
        : undefined;
    return this.prisma.whatsappInbound.update({
      where: { id },
      data: {
        status: dto.status,
        parsed: merged as unknown as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /** Onaylanan mesajı DRAFT etkinliğe dönüştürür. Zaten dönüştürülmüşse onu döner. */
  async convert(id: string) {
    const row = await this.get(id);
    if (row.eventId) {
      const ev = await this.prisma.event.findUnique({ where: { id: row.eventId } });
      if (ev) return ev;
    }

    const p = (row.parsed ?? {}) as Partial<ParsedEvent>;
    if (!p.title) throw new BadRequestException('Başlık yok — önce parse alanlarını düzelt.');
    if (!p.startsAt) throw new BadRequestException('Tarih (startsAt) yok — önce düzelt.');

    // Kategori slug → id (eşleşmezse kategorisiz DRAFT).
    let categoryId: string | undefined;
    if (p.categorySlug) {
      const cat = await this.prisma.category.findUnique({ where: { slug: p.categorySlug } });
      categoryId = cat?.id;
    }

    // Benzersiz slug: title-slug + gerekirse kısa sonek.
    const base = slugify(p.title);
    let slug = base;
    for (let n = 2; n < 50; n++) {
      const clash = await this.prisma.event.findUnique({ where: { slug } });
      if (!clash) break;
      slug = `${base}-${n}`;
    }

    const cover = row.mediaUrls[0];
    const desc = [p.description, p.priceText ? `Fiyat: ${p.priceText}` : null]
      .filter(Boolean)
      .join('\n\n');

    const event = await this.prisma.event.create({
      data: {
        slug,
        title: p.title,
        description: desc || undefined,
        startsAt: new Date(p.startsAt),
        endsAt: p.endsAt ? new Date(p.endsAt) : undefined,
        status: EventStatus.DRAFT,
        categoryId,
        coverUrl: cover,
      },
    });

    await this.prisma.whatsappInbound.update({
      where: { id },
      data: { status: WaInboundStatus.CONVERTED, eventId: event.id },
    });

    return event;
  }
}
