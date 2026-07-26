// Ana sayfadaki video koleksiyonları — admin panelinden yönetilir (Collection + CollectionItem).
const BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";

export type CollectionItem = {
  id: string;
  url: string;
  videoId: string;
  title: string;
  author: string | null;
  thumbUrl: string | null;
};

export type Collection = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  items: CollectionItem[];
};

export async function getCollections(): Promise<Collection[]> {
  try {
    const res = await fetch(`${BASE}/collections`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as Collection[]) : [];
  } catch {
    return [];
  }
}
