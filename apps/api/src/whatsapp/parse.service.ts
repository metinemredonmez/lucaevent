import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Parse edilmiş etkinlik alanları — DRAFT Event'e prefill için. */
export interface ParsedEvent {
  title: string | null;
  startsAt: string | null; // ISO 8601
  endsAt: string | null; // ISO 8601
  venue: string | null; // serbest metin (mekan adı / konum)
  categorySlug: string | null; // wellness | outdoor-spor | ...
  description: string | null;
  priceText: string | null; // "150 TL", "ücretsiz" gibi ham fiyat metni
  confidence: number; // 0..1 — düşükse admin doldurur
}

// API'deki gerçek kategori slug'ları (bkz. prisma/seed.ts).
const CATEGORY_SLUGS = [
  'wellness',
  'outdoor-spor',
  'gezi-seyahat',
  'workshop',
  'social',
  'food-drink',
  'business',
  'nightlife',
] as const;

const EMPTY: ParsedEvent = {
  title: null,
  startsAt: null,
  endsAt: null,
  venue: null,
  categorySlug: null,
  description: null,
  priceText: null,
  confidence: 0,
};

@Injectable()
export class WhatsappParseService {
  private readonly logger = new Logger(WhatsappParseService.name);

  constructor(private readonly config: ConfigService) {}

  /** Serbest WhatsApp metnini yapılandırılmış etkinliğe çevirir. */
  async parse(rawText: string): Promise<ParsedEvent> {
    const text = (rawText ?? '').trim();
    if (!text) return { ...EMPTY };

    const key = this.config.get<string>('ANTHROPIC_API_KEY');
    if (key) {
      try {
        return await this.parseWithClaude(text, key);
      } catch (e) {
        this.logger.warn(`Claude parse başarısız, regex fallback: ${(e as Error).message}`);
      }
    }
    return this.parseWithRegex(text);
  }

  // ---- Claude (Anthropic REST, SDK'sız) ----
  private async parseWithClaude(text: string, key: string): Promise<ParsedEvent> {
    const model = this.config.get<string>('ANTHROPIC_MODEL') || 'claude-haiku-4-5-20251001';
    const today = new Date().toISOString().slice(0, 10);
    const system =
      'Sen bir etkinlik ayrıştırıcısısın. Sana WhatsApp mesajı verilir; ' +
      'içinden tek bir etkinliğin alanlarını çıkar ve SADECE JSON döndür. ' +
      `Bugünün tarihi: ${today}. Göreli tarihleri ("cumartesi", "yarın", "18 Ocak") ` +
      'bu tarihe göre ISO 8601 (Europe/Istanbul, +03:00) formatına çevir. ' +
      'Saat yoksa startsAt saatini boş bırakma, günün başlangıcını değil, bilinmiyorsa null ver. ' +
      `categorySlug şunlardan biri olmalı ya da null: ${CATEGORY_SLUGS.join(', ')}. ` +
      'Emin olmadığın alanı null yap ve confidence (0..1) değerini düşür. ' +
      'Alanlar: title, startsAt, endsAt, venue, categorySlug, description, priceText, confidence.';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        system,
        messages: [{ role: 'user', content: text }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const raw = data.content?.find((c) => c.type === 'text')?.text ?? '';
    const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
    const parsed = JSON.parse(json) as Partial<ParsedEvent>;

    return this.normalize(parsed);
  }

  // ---- Anahtarsız regex fallback ----
  private parseWithRegex(text: string): ParsedEvent {
    const firstLine = text.split('\n').map((l) => l.trim()).find(Boolean) ?? null;
    return this.normalize({
      title: firstLine ? firstLine.slice(0, 120) : null,
      startsAt: this.guessDate(text),
      endsAt: null,
      venue: this.guessVenue(text),
      categorySlug: this.guessCategory(text),
      description: text.slice(0, 2000),
      priceText: this.guessPrice(text),
      confidence: 0.3,
    });
  }

  private guessDate(text: string): string | null {
    const months: Record<string, number> = {
      ocak: 0, şubat: 1, subat: 1, mart: 2, nisan: 3, mayıs: 4, mayis: 4, haziran: 5,
      temmuz: 6, ağustos: 7, agustos: 7, eylül: 8, eylul: 8, ekim: 9, kasım: 10, kasim: 10, aralık: 11, aralik: 11,
    };
    const lower = text.toLocaleLowerCase('tr-TR');
    // "18 Ocak" / "18 Ocak 14:00"
    const m = lower.match(/(\d{1,2})\s+([a-zçğıöşü]+)(?:\s+(\d{1,2})[:.](\d{2}))?/);
    if (m && months[m[2]] !== undefined) {
      const now = new Date();
      const year = now.getFullYear();
      const day = Number(m[1]);
      const hour = m[3] ? Number(m[3]) : 20;
      const min = m[4] ? Number(m[4]) : 0;
      const d = new Date(Date.UTC(year, months[m[2]], day, hour - 3, min));
      if (d.getTime() < now.getTime() - 86_400_000) d.setUTCFullYear(year + 1);
      return d.toISOString();
    }
    return null;
  }

  private guessVenue(text: string): string | null {
    const m = text.match(/(?:yer|mekan|konum|adres|lokasyon)\s*[:：]\s*(.+)/i);
    return m ? m[1].trim().slice(0, 160) : null;
  }

  private guessPrice(text: string): string | null {
    if (/ücretsiz|ucretsiz|free|bedava/i.test(text)) return 'ücretsiz';
    const m = text.match(/(\d[\d.]*)\s*(tl|₺|try)/i);
    return m ? `${m[1]} TL` : null;
  }

  private guessCategory(text: string): string | null {
    const t = text.toLocaleLowerCase('tr-TR');
    const map: Array<[RegExp, string]> = [
      [/yoga|pilates|meditasyon|nefes|wellness|spa/i, 'wellness'],
      [/koşu|kosu|tırmanış|bisiklet|trekking|doğa yürüyüş|kamp|spor/i, 'outdoor-spor'],
      [/tur|gezi|seyahat|tekne|kamp gezisi/i, 'gezi-seyahat'],
      [/atölye|atolye|workshop|seramik|resim/i, 'workshop'],
      [/tanışma|tanisma|brunch|buluşma|networking sosyal/i, 'social'],
      [/yemek|şarap|sarap|kokteyl|brunch|peynir|food/i, 'food-drink'],
      [/networking|founders|business|iş/i, 'business'],
      [/parti|dj|gece|night|sahne/i, 'nightlife'],
    ];
    for (const [re, slug] of map) if (re.test(t)) return slug;
    return null;
  }

  private normalize(p: Partial<ParsedEvent>): ParsedEvent {
    const slug =
      p.categorySlug && (CATEGORY_SLUGS as readonly string[]).includes(p.categorySlug)
        ? p.categorySlug
        : null;
    const iso = (v: unknown): string | null => {
      if (!v || typeof v !== 'string') return null;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d.toISOString();
    };
    return {
      title: p.title?.toString().trim().slice(0, 120) || null,
      startsAt: iso(p.startsAt),
      endsAt: iso(p.endsAt),
      venue: p.venue?.toString().trim().slice(0, 160) || null,
      categorySlug: slug,
      description: p.description?.toString().trim().slice(0, 4000) || null,
      priceText: p.priceText?.toString().trim().slice(0, 60) || null,
      confidence: typeof p.confidence === 'number' ? Math.max(0, Math.min(1, p.confidence)) : 0.5,
    };
  }
}
