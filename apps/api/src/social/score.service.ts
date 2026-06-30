import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Rozet eşikleri (puana göre artan). */
const BADGES = [
  { min: 0, name: 'Yeni Üye', level: 1, icon: '🌱' },
  { min: 100, name: 'Kaşif', level: 2, icon: '🧭' },
  { min: 300, name: 'Düzenli', level: 3, icon: '⭐' },
  { min: 700, name: 'Topluluk', level: 4, icon: '🔥' },
  { min: 1500, name: 'Efsane', level: 5, icon: '👑' },
];

@Injectable()
export class ScoreService {
  constructor(private readonly prisma: PrismaService) {}

  /** Üyenin etkinlik geçmişinden katılım puanı + seviye/rozet. */
  async forUser(userId: string) {
    const [orders, favorites, reviews] = await Promise.all([
      this.prisma.order.count({ where: { userId, status: 'PAID' } }),
      this.prisma.favorite.count({ where: { userId } }),
      this.prisma.review.count({ where: { userId } }),
    ]);

    const score = orders * 60 + favorites * 8 + reviews * 25;
    let cur = BADGES[0];
    for (const b of BADGES) if (score >= b.min) cur = b;
    const next = BADGES.find((b) => b.min > score) ?? null;
    const progress = next
      ? Math.max(0, Math.min(100, Math.round(((score - cur.min) / (next.min - cur.min)) * 100)))
      : 100;

    return {
      score,
      level: cur.level,
      badge: cur.name,
      icon: cur.icon,
      nextBadge: next?.name ?? null,
      nextAt: next?.min ?? null,
      progress,
      breakdown: { orders, favorites, reviews },
    };
  }
}
