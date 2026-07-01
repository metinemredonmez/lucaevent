import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Rütbe eşikleri (puana göre artan) — "admin gibi" seviye hissi. */
const BADGES = [
  { min: 0, name: 'Yeni Üye', level: 1, icon: '🌱' },
  { min: 100, name: 'Kaşif', level: 2, icon: '🧭' },
  { min: 300, name: 'Düzenli', level: 3, icon: '⭐' },
  { min: 700, name: 'Topluluk', level: 4, icon: '🔥' },
  { min: 1500, name: 'Efsane', level: 5, icon: '👑' },
];

const PTS = { order: 60, favorite: 8, review: 25 };

function badgeFor(score: number) {
  let cur = BADGES[0];
  for (const b of BADGES) if (score >= b.min) cur = b;
  return cur;
}

/** Gizlilik: tam ad yerine "Emre D." biçimi. */
function displayName(name?: string | null): string {
  const t = (name || '').trim();
  if (!t) return 'Luca Üyesi';
  const parts = t.split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

@Injectable()
export class ScoreService {
  constructor(private readonly prisma: PrismaService) {}

  /** Üyenin etkinlik geçmişinden katılım puanı + seviye/rütbe. */
  async forUser(userId: string) {
    const [orders, favorites, reviews] = await Promise.all([
      this.prisma.order.count({ where: { userId, status: 'PAID' } }),
      this.prisma.favorite.count({ where: { userId } }),
      this.prisma.review.count({ where: { userId } }),
    ]);

    const score = orders * PTS.order + favorites * PTS.favorite + reviews * PTS.review;
    const cur = badgeFor(score);
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

  /**
   * Liderlik tablosu — "kim en aktif". Tüm üyelerin etkinlik aktivitesini
   * puanlayıp en yüksekten sıralar (sohbet yok; sadece aktiviteyle görünürlük).
   */
  async leaderboard(limit = 20) {
    const [orders, favs, reviews] = await Promise.all([
      this.prisma.order.groupBy({ by: ['userId'], where: { status: 'PAID', userId: { not: null } }, _count: true }),
      this.prisma.favorite.groupBy({ by: ['userId'], _count: true }),
      this.prisma.review.groupBy({ by: ['userId'], _count: true }),
    ]);

    const acc = new Map<string, { o: number; f: number; r: number }>();
    const bump = (uid: string | null, key: 'o' | 'f' | 'r', n: number) => {
      if (!uid) return;
      const e = acc.get(uid) ?? { o: 0, f: 0, r: 0 };
      e[key] += n;
      acc.set(uid, e);
    };
    for (const x of orders) bump(x.userId, 'o', x._count);
    for (const x of favs) bump(x.userId, 'f', x._count);
    for (const x of reviews) bump(x.userId, 'r', x._count);

    const scored = [...acc.entries()]
      .map(([uid, c]) => ({ uid, score: c.o * PTS.order + c.f * PTS.favorite + c.r * PTS.review }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return [];

    // demo/sistem hesaplarını (@luca.test) liderlikten hariç tut
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: scored.map((s) => s.uid) },
        NOT: { email: { endsWith: '@luca.test' } },
      },
      select: { id: true, name: true, avatarUrl: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    return scored
      .filter((s) => byId.has(s.uid))
      .slice(0, limit)
      .map((s, i) => {
        const u = byId.get(s.uid)!;
        const b = badgeFor(s.score);
        return {
          rank: i + 1,
          name: displayName(u.name),
          avatarUrl: u.avatarUrl ?? null,
          score: s.score,
          badge: b.name,
          icon: b.icon,
          level: b.level,
        };
      });
  }
}
