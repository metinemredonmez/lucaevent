import { Injectable, Logger } from '@nestjs/common';

// Canlı radyo "şu an çalan" bilgisi (ICY StreamTitle). Tarayıcı yayının içindeki
// metadata'yı okuyamaz; burada Icy-MetaData:1 ile bağlanıp ilk metadata bloğunu
// ayrıştırıp başlığı döndürüyoruz. Kısa cache + SSRF koruması.
@Injectable()
export class RadioService {
  private readonly logger = new Logger(RadioService.name);
  private readonly cache = new Map<string, { title: string | null; ts: number }>();
  private readonly TTL = 8_000;

  // Özel/iç ağ adreslerine istek atılmasını engelle (basit SSRF koruması).
  private isBlockedHost(host: string): boolean {
    const h = host.toLowerCase();
    if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true;
    if (/^(127\.|10\.|169\.254\.|192\.168\.|::1|0\.0\.0\.0)/.test(h)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
    return false;
  }

  async nowPlaying(rawUrl: string): Promise<{ title: string | null }> {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      return { title: null };
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return { title: null };
    if (this.isBlockedHost(url.hostname)) return { title: null };

    const hit = this.cache.get(rawUrl);
    if (hit && Date.now() - hit.ts < this.TTL) return { title: hit.title };

    const title = await this.readIcyTitle(rawUrl).catch(() => null);
    this.cache.set(rawUrl, { title, ts: Date.now() });
    return { title };
  }

  private async readIcyTitle(url: string): Promise<string | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, {
        headers: { 'Icy-MetaData': '1', 'User-Agent': 'Luca-Radio/1.0', Accept: '*/*' },
        redirect: 'follow',
        signal: controller.signal,
      });
      const metaInt = Number(res.headers.get('icy-metaint'));
      if (!res.body || !Number.isFinite(metaInt) || metaInt <= 0) {
        return null;
      }
      const reader = res.body.getReader();
      let audioSkipped = 0;
      let phase: 'audio' | 'len' | 'meta' = 'audio';
      let metaLen = 0;
      let metaBuf: number[] = [];

      // metaInt bayt ses → 1 bayt (uzunluk/16) → metadata bloğu. İlk bloğu oku, bırak.
      for (let guard = 0; guard < 64; guard++) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        for (let i = 0; i < value.length; i++) {
          if (phase === 'audio') {
            audioSkipped++;
            if (audioSkipped >= metaInt) phase = 'len';
          } else if (phase === 'len') {
            metaLen = value[i] * 16;
            if (metaLen === 0) {
              // bu blokta başlık yok — sonraki bloğa geç
              audioSkipped = 0;
              phase = 'audio';
            } else {
              phase = 'meta';
            }
          } else {
            metaBuf.push(value[i]);
            if (metaBuf.length >= metaLen) {
              await reader.cancel().catch(() => {});
              const text = Buffer.from(metaBuf).toString('utf8');
              const m = text.match(/StreamTitle='([^']*)'/);
              const t = m?.[1]?.trim();
              return t ? t : null;
            }
          }
        }
      }
      await reader.cancel().catch(() => {});
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
