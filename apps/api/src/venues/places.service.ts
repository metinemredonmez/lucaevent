import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Google Places'ten normalize edilmiş mekan verisi (placeCache'te saklanır). */
export interface PlaceData {
  placeId: string;
  lat: number;
  lng: number;
  phone?: string;
  rating?: number;
  ratingCount?: number;
  website?: string;
  mapsUri?: string;
  photoName?: string; // Google foto kaynağı (places/.../photos/...) — proxy ile servis edilir
  weekdayText?: string[];
  periods?: Array<{
    open: { day: number; hour: number; minute: number };
    close?: { day: number; hour: number; minute: number };
  }>;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün — koordinat/saat sık değişmez
const DETAILS_FIELDS =
  'id,location,internationalPhoneNumber,rating,userRatingCount,websiteUri,googleMapsUri,regularOpeningHours,photos';

type VenueLike = {
  id: string;
  name: string;
  city?: string | null;
  googlePlaceId?: string | null;
  placeCache?: Prisma.JsonValue | null;
  placeCachedAt?: Date | null;
};

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private key(): string {
    return this.config.get<string>('GOOGLE_PLACES_API_KEY') || '';
  }

  /** Mekanı Google verisiyle zenginleştir (cache'li). Key yoksa/eşleşmezse null. */
  async enrich(v: VenueLike): Promise<PlaceData | null> {
    const key = this.key();
    if (!key) return null;

    const fresh =
      v.placeCache &&
      v.placeCachedAt &&
      Date.now() - new Date(v.placeCachedAt).getTime() < CACHE_TTL_MS;
    if (fresh) return v.placeCache as unknown as PlaceData;

    try {
      const placeId = v.googlePlaceId || (await this.searchPlaceId(v.name, v.city, key));
      if (!placeId) return null;
      const data = await this.details(placeId, key);
      if (!data) return null;
      await this.prisma.venue.update({
        where: { id: v.id },
        data: {
          placeCache: data as unknown as Prisma.InputJsonValue,
          placeCachedAt: new Date(),
          googlePlaceId: data.placeId,
        },
      });
      return data;
    } catch (e) {
      this.logger.warn(`Places enrich başarısız (${v.name}): ${(e as Error).message}`);
      return null;
    }
  }

  /** İsim + şehirden placeId bul (Text Search New). */
  private async searchPlaceId(name: string, city: string | null | undefined, key: string): Promise<string | null> {
    const textQuery = [name, city, 'Türkiye'].filter(Boolean).join(', ');
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.id',
      },
      body: JSON.stringify({ textQuery, languageCode: 'tr', regionCode: 'TR' }),
    });
    if (!res.ok) throw new Error(`searchText ${res.status}`);
    const data = (await res.json()) as { places?: Array<{ id: string }> };
    return data.places?.[0]?.id ?? null;
  }

  /** Place Details (New) → normalize. */
  private async details(placeId: string, key: string): Promise<PlaceData | null> {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': DETAILS_FIELDS },
    });
    if (!res.ok) throw new Error(`details ${res.status}`);
    const p = (await res.json()) as any;
    if (!p?.location) return null;
    return {
      placeId: p.id ?? placeId,
      lat: p.location.latitude,
      lng: p.location.longitude,
      phone: p.internationalPhoneNumber || undefined,
      rating: typeof p.rating === 'number' ? p.rating : undefined,
      ratingCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : undefined,
      website: p.websiteUri || undefined,
      mapsUri: p.googleMapsUri || undefined,
      photoName: p.photos?.[0]?.name || undefined,
      weekdayText: p.regularOpeningHours?.weekdayDescriptions || undefined,
      periods: p.regularOpeningHours?.periods || undefined,
    };
  }

  /** Google foto medyasını sunucudan getir (key gizli). ref = places/.../photos/... */
  async fetchPhoto(ref: string, maxH = 400): Promise<{ body: ArrayBuffer; contentType: string } | null> {
    const key = this.key();
    if (!key || !ref.startsWith('places/')) return null;
    const url = `https://places.googleapis.com/v1/${ref}/media?maxHeightPx=${maxH}&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return { body: await res.arrayBuffer(), contentType: res.headers.get('content-type') || 'image/jpeg' };
  }
}
