// Public içerik (blog yazıları + içerik sayfaları) — server component'lerde okunur.
const BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";

export type PostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
};
export type Post = PostSummary & { content: string; status: string };
export type ContentPage = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
};

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(BASE + path, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const getPosts = () => get<PostSummary[]>("/posts");
export const getPost = (slug: string) => get<Post>(`/posts/${encodeURIComponent(slug)}`);
export const getPage = (slug: string) => get<ContentPage>(`/pages/${encodeURIComponent(slug)}`);
