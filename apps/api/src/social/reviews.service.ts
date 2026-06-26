import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private async eventBySlug(slug: string) {
    const ev = await this.prisma.event.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!ev) throw new NotFoundException('Event not found');
    return ev;
  }

  /** Create/update a review. Only buyers (PAID order) may review; one per user/event. */
  async create(user: CurrentUserPayload, slug: string, rating: number, comment?: string) {
    const ev = await this.eventBySlug(slug);
    const paid = await this.prisma.order.findFirst({
      where: {
        eventId: ev.id,
        status: 'PAID',
        OR: [{ userId: user.sub }, { email: user.email }],
      },
      select: { id: true },
    });
    if (!paid) throw new ForbiddenException('Only attendees can review this event');

    return this.prisma.review.upsert({
      where: { userId_eventId: { userId: user.sub, eventId: ev.id } },
      update: { rating, comment },
      create: { userId: user.sub, eventId: ev.id, rating, comment },
    });
  }

  async listForEvent(slug: string) {
    const ev = await this.eventBySlug(slug);
    const [items, agg] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { eventId: ev.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { name: true, avatarUrl: true } },
        },
      }),
      this.prisma.review.aggregate({
        where: { eventId: ev.id },
        _avg: { rating: true },
        _count: true,
      }),
    ]);
    return {
      items,
      count: agg._count,
      avg: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
    };
  }
}
