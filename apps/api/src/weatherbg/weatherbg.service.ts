import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Havaya göre CANLI arka plan görseli — Pexels'ten İstanbul + hava sorgusuyla çeker,
// cache'ler. Key yoksa / hata olursa yerel görsele (web public) düşer.
@Injectable()
export class WeatherBgService {
  private readonly logger = new Logger(WeatherBgService.name);
  private readonly cache = new Map<string, { url: string; ts: number }>();
  private readonly TTL = 2 * 60 * 60 * 1000; // 2 saat

  constructor(private readonly config: ConfigService) {}

  private plan(cond: string, day: boolean): { q: string; fallback: string } {
    switch (cond) {
      case 'rain':
        return { q: 'istanbul rainy wet street rain', fallback: 'istanbul-rain.jpg' };
      case 'snow':
        return { q: 'istanbul snow snowy winter', fallback: 'istanbul-snow.jpg' };
      case 'clouds':
        return { q: 'istanbul cloudy overcast grey sky', fallback: 'istanbul-cloudy.jpg' };
      default:
        return day
          ? { q: 'istanbul sunny clear blue sky bosphorus', fallback: 'istanbul-dusk.jpg' }
          : { q: 'istanbul night bosphorus city lights', fallback: 'bosphorus-night.jpg' };
    }
  }

  async resolve(cond: string, day: boolean): Promise<string> {
    const { q, fallback } = this.plan(cond, day);
    const web = (this.config.get<string>('WEB_URL') || '').replace(/\/$/, '');
    const local = `${web}/img/hero/${fallback}`;
    const key = this.config.get<string>('PEXELS_API_KEY');
    if (!key) return local;

    const ck = `${cond}:${day ? 'd' : 'n'}`;
    const hit = this.cache.get(ck);
    if (hit && Date.now() - hit.ts < this.TTL) return hit.url;

    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=landscape&size=large&per_page=20`,
        { headers: { Authorization: key } },
      );
      if (!res.ok) return local;
      const data = (await res.json()) as { photos?: Array<{ src?: Record<string, string> }> };
      const photos = data.photos ?? [];
      if (!photos.length) return local;
      const pick = photos[Math.floor(Math.random() * Math.min(photos.length, 15))];
      const url = pick?.src?.landscape || pick?.src?.large2x || pick?.src?.large;
      if (!url) return local;
      this.cache.set(ck, { url, ts: Date.now() });
      return url;
    } catch (e) {
      this.logger.warn(`Pexels weather-bg başarısız: ${(e as Error).message}`);
      return local;
    }
  }
}
