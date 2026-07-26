import { BadRequestException } from '@nestjs/common';

/** YouTube URL biçimlerinden video id çıkarır (watch?v=, youtu.be, shorts, embed, live). */
export function parseYoutubeId(input: string): string {
  const raw = input.trim();
  // Çıplak id yapıştırıldıysa doğrudan kabul et.
  if (/^[\w-]{11}$/.test(raw)) return raw;
  let u: URL;
  try {
    u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
  } catch {
    throw new BadRequestException(`Geçersiz YouTube adresi: ${input}`);
  }
  const host = u.hostname.replace(/^www\./, '');
  const ok = (id?: string | null) => (id && /^[\w-]{11}$/.test(id) ? id : null);

  if (host === 'youtu.be') {
    const id = ok(u.pathname.split('/')[1]);
    if (id) return id;
  }
  if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    const v = ok(u.searchParams.get('v'));
    if (v) return v;
    const parts = u.pathname.split('/').filter(Boolean);
    if (['shorts', 'embed', 'live', 'v'].includes(parts[0])) {
      const id = ok(parts[1]);
      if (id) return id;
    }
  }
  throw new BadRequestException(`YouTube video adresi çözülemedi: ${input}`);
}

export type YoutubeMeta = {
  videoId: string;
  url: string;
  title: string;
  author: string | null;
  thumbUrl: string;
};

/**
 * oEmbed ile videonun başlığı/kanalı çekilir (anahtar gerektirmez).
 * Servis ulaşılamazsa item yine eklenir; başlık video id'ye düşer.
 */
export async function fetchYoutubeMeta(input: string): Promise<YoutubeMeta> {
  const videoId = parseYoutubeId(input);
  // Liste/radyo parametreleri (list=RD…, start_radio, t) kaydedilmez — tek videoya normalize.
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const base: YoutubeMeta = {
    videoId,
    url,
    title: videoId,
    author: null,
    thumbUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`,
      { signal: ctrl.signal },
    );
    clearTimeout(t);
    if (!res.ok) return base;
    const d = (await res.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
    return {
      ...base,
      title: d.title?.trim() || base.title,
      author: d.author_name?.trim() || null,
      // maxresdefault her videoda yok; oEmbed'in verdiği kapak garanti çalışır.
      thumbUrl: d.thumbnail_url?.trim() || base.thumbUrl,
    };
  } catch {
    return base;
  }
}
