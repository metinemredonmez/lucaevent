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

export async function getCommunityCount(): Promise<number | null> {
  try {
    const r = await fetch(`${BASE}/community/stats`, { cache: "no-store" });
    if (!r.ok) return null;
    const d = await r.json();
    return typeof d?.members === "number" ? d.members : null;
  } catch {
    return null;
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

// ——— tek etkinlik detayı (public /events/:slug) ———
export type EventDetail = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  coverUrl: string | null;
  kind: string;
  startsAt: string;
  endsAt: string | null;
  doorsAt: string | null;
  campingAllowed: boolean;
  travelInfo: string | null;
  ageMin: number | null;
  agenda: { time: string; title: string }[] | null;
  included: string[] | null;
  bringList: string[] | null;
  venue: DiscoverVenue | null;
  category: { id: string; slug: string; name: string; color: string | null } | null;
  lineup: { id: string; isHeadline: boolean; artist: { id: string; name: string; slug: string } }[];
  tickets: { id: string; name: string; priceMinor: number; capacity: number | null; sold: number }[];
};

export async function getEvent(slug: string): Promise<EventDetail | null> {
  try {
    const r = await fetch(`${BASE}/events/${encodeURIComponent(slug)}`, {
      next: { revalidate: 30 },
    });
    return r.ok ? ((await r.json()) as EventDetail) : null;
  } catch {
    return null;
  }
}

/** Tarayıcıdan açılacak .ics takvim linki. */
export function eventIcsUrl(slug: string): string {
  return `${BASE}/events/${encodeURIComponent(slug)}/calendar.ics`;
}

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
