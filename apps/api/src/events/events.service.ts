import { Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventCreateDto, EventQueryDto, EventUpdateDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(q: EventQueryDto) {
    const where: Prisma.EventWhereInput = { status: EventStatus.PUBLISHED };
    if (q.kind) where.kind = q.kind;

    if (q.range === 'upcoming') {
      where.startsAt = { gte: new Date() };
    } else if (q.range === 'past') {
      where.startsAt = { lt: new Date() };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        take: q.take ?? 20,
        skip: q.skip ?? 0,
        orderBy: { startsAt: q.range === 'past' ? 'desc' : 'asc' },
        include: {
          venue: { select: { id: true, name: true, city: true } },
          lineup: {
            include: { artist: { select: { id: true, name: true, slug: true } } },
            orderBy: { order: 'asc' },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return { items, total, take: q.take ?? 20, skip: q.skip ?? 0 };
  }

  async bySlug(slug: string) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: {
        venue: true,
        lineup: {
          include: { artist: true },
          orderBy: { order: 'asc' },
        },
        tickets: { orderBy: { position: 'asc' } },
        media: true,
        heroMedia: true,
      },
    });
    if (!event || event.status !== EventStatus.PUBLISHED) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  // ------- admin ops -------

  listAll(q: EventQueryDto) {
    const where: Prisma.EventWhereInput = {};
    if (q.kind) where.kind = q.kind;
    return this.prisma.event.findMany({
      where,
      take: q.take ?? 50,
      skip: q.skip ?? 0,
      orderBy: { startsAt: 'desc' },
      include: { venue: { select: { name: true, city: true } } },
    });
  }

  byId(id: string) {
    return this.prisma.event.findUniqueOrThrow({
      where: { id },
      include: { venue: true, lineup: { include: { artist: true } }, tickets: true, media: true },
    });
  }

  create(dto: EventCreateDto) {
    return this.prisma.event.create({
      data: {
        ...dto,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        doorsAt: dto.doorsAt ? new Date(dto.doorsAt) : undefined,
        status: EventStatus.DRAFT,
      },
    });
  }

  update(id: string, dto: EventUpdateDto) {
    const { startsAt, endsAt, doorsAt, ...rest } = dto;
    return this.prisma.event.update({
      where: { id },
      data: {
        ...rest,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt ? new Date(endsAt) : undefined,
        doorsAt: doorsAt ? new Date(doorsAt) : undefined,
      },
    });
  }

  async publish(id: string) {
    return this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.PUBLISHED, publishedAt: new Date() },
    });
  }

  async unpublish(id: string) {
    return this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.DRAFT },
    });
  }

  remove(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }
}
