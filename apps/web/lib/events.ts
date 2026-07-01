// Public keşfet etkinlikleri — DB'den (harita + liste).
const BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";

// ——— ana sayfa vitrini (public) ———
export type LiveEvent = { slug: string; title: string; coverUrl: string | null; liveStartedAt: string | null };
export async function getLiveEvents(): Promise<LiveEvent[]> {
  try {
    const r = await fetch(`${BASE}/events/live`, { cache: "no-store" });
    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}

export type TopMember = { rank: number; name: string; avatarUrl: string | null; score: number; badge: string; icon: string; level: number };
export async function getTopMembers(take = 5): Promise<TopMember[]> {
  try {
    const r = await fetch(`${BASE}/community/leaderboard?take=${take}`);
    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}

export type DiscoverVenue = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
};
export type DiscoverEvent = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  coverUrl: string | null;
  startsAt: string;
  kind: string;
  venue: DiscoverVenue | null;
  category: { id: string; slug: string; name: string; color: string | null } | null;
};

export type DiscoverParams = {
  q?: string;
  categoryId?: string;
  range?: "today" | "tomorrow" | "weekend" | "upcoming" | "past";
  take?: number;
};

export async function discoverEvents(p: DiscoverParams = {}): Promise<DiscoverEvent[]> {
  const qs = new URLSearchParams();
  qs.set("take", String(p.take ?? 100));
  qs.set("range", p.range ?? "upcoming");
  if (p.q) qs.set("q", p.q);
  if (p.categoryId) qs.set("categoryId", p.categoryId);
  try {
    const res = await fetch(`${BASE}/events?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.items ?? data ?? []) as DiscoverEvent[];
  } catch {
    return [];
  }
}
