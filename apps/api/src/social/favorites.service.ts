import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    await this.prisma.favorite.upsert({
      where: { userId_eventId: { userId, eventId } },
      update: {},
      create: { userId, eventId },
    });
    return { ok: true };
  }

  async remove(userId: string, eventId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, eventId } });
    return { ok: true };
  }

  list(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            slug: true,
            title: true,
            startsAt: true,
            coverUrl: true,
            kind: true,
            category: { select: { slug: true, name: true } },
          },
        },
      },
    });
  }
}
