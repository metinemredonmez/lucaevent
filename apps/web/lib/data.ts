import type { LucideIcon } from "lucide-react";
import {
  Flower2,
  Mountain,
  Compass,
  Palette,
  Coffee,
  Wine,
  Briefcase,
  Disc3,
} from "lucide-react";

/**
 * Luca artık bir gece kulübü değil — bir etkinlik / yaşam platformu.
 * Gece kulübü (nightlife) yalnızca dikeylerden biri. Şemsiye model:
 * "Sadece gece değil; event + gezi + spor + atölye."
 */
export type CategorySlug =
  | "wellness"
  | "outdoor"
  | "gezi"
  | "workshop"
  | "social"
  | "food"
  | "business"
  | "nightlife";

export interface Category {
  slug: CategorySlug;
  name: string;
  emoji: string;
  tagline: string;
  icon: LucideIcon;
  /** accent color for category mode (hex) — mor/menekşe ailesi */
  accent: string;
  cover: string;
}

export const CATEGORIES: Category[] = [
  {
    slug: "wellness",
    name: "Wellness",
    emoji: "🧘",
    tagline: "Nefes al, dengele",
    icon: Flower2,
    accent: "#A78BFA",
    // kategori kapağı temsilci etkinlik görselinden gelir (ayrı indirme gerekmez)
    cover: "/img/events/sunset-yoga-sound-healing.jpg",
  },
  {
    slug: "outdoor",
    name: "Outdoor & Spor",
    emoji: "🏃",
    tagline: "Şehrin dışına çık",
    icon: Mountain,
    accent: "#6366F1",
    cover: "/img/events/belgrad-sabah-kosusu.jpg",
  },
  {
    slug: "gezi",
    name: "Gezi & Seyahat",
    emoji: "⛵",
    tagline: "Yola düş",
    icon: Compass,
    accent: "#8B5CF6",
    cover: "/img/events/bogaz-gun-batimi-tekne.jpg",
  },
  {
    slug: "workshop",
    name: "Workshop",
    emoji: "🎨",
    tagline: "Elinle üret",
    icon: Palette,
    accent: "#C084FC",
    cover: "/img/events/seramik-atolyesi-kupa.jpg",
  },
  {
    slug: "social",
    name: "Social",
    emoji: "☕",
    tagline: "Yeni insanlar",
    icon: Coffee,
    accent: "#E879F9",
    cover: "/img/events/pazar-brunch-tanisma.jpg",
  },
  {
    slug: "food",
    name: "Food & Drink",
    emoji: "🍷",
    tagline: "Tat ve paylaş",
    icon: Wine,
    accent: "#D946EF",
    cover: "/img/events/rooftop-sarap-peynir.jpg",
  },
  {
    slug: "business",
    name: "Business",
    emoji: "💼",
    tagline: "Bağlantı kur",
    icon: Briefcase,
    accent: "#7C3AED",
    cover: "/img/events/founders-breakfast.jpg",
  },
  {
    slug: "nightlife",
    name: "Nightlife",
    emoji: "🎶",
    tagline: "Gece kendi ritmini bulur",
    icon: Disc3,
    accent: "#A855F7",
    cover: "/img/events/luca-006-kadikoy.jpg",
  },
];

export interface Activity {
  id: string;
  category: CategorySlug;
  title: string;
  date: string; // ISO
  location: string;
  attendees: number;
  capacity: number;
  cover: string;
}

/**
 * Backend seed'iyle aynı slug'lar — görsel dosya adları docs/13-gorsel-haritasi.md
 * ile birebir. Dosyalar public/img/events/<slug>.jpg olarak düştüğünde otomatik dolar.
 */
export const UPCOMING_ACTIVITIES: Activity[] = [
  {
    id: "sunset-yoga-sound-healing",
    category: "wellness",
    title: "Sunset Yoga & Ses Banyosu",
    date: "2026-07-04T19:00:00+03:00",
    location: "Caddebostan Sahili",
    attendees: 38,
    capacity: 45,
    cover: "/img/events/sunset-yoga-sound-healing.jpg",
  },
  {
    id: "sabah-reformer-pilates",
    category: "wellness",
    title: "Sabah Reformer Pilates",
    date: "2026-07-06T08:00:00+03:00",
    location: "Nişantaşı · Stüdyo",
    attendees: 9,
    capacity: 12,
    cover: "/img/events/sabah-reformer-pilates.jpg",
  },
  {
    id: "belgrad-sabah-kosusu",
    category: "outdoor",
    title: "Belgrad Ormanı Sabah Koşusu",
    date: "2026-07-05T07:30:00+03:00",
    location: "Belgrad Ormanı · Neşet Suyu",
    attendees: 64,
    capacity: 80,
    cover: "/img/events/belgrad-sabah-kosusu.jpg",
  },
  {
    id: "bogaz-gun-batimi-tekne",
    category: "gezi",
    title: "Boğaz Gün Batımı Tekne Turu",
    date: "2026-07-11T18:30:00+03:00",
    location: "Beşiktaş İskelesi",
    attendees: 58,
    capacity: 60,
    cover: "/img/events/bogaz-gun-batimi-tekne.jpg",
  },
  {
    id: "seramik-atolyesi-kupa",
    category: "workshop",
    title: "Seramik Atölyesi · Kendi Kupanı Yap",
    date: "2026-07-09T18:00:00+03:00",
    location: "Kadıköy · Atölye",
    attendees: 11,
    capacity: 14,
    cover: "/img/events/seramik-atolyesi-kupa.jpg",
  },
  {
    id: "pazar-brunch-tanisma",
    category: "social",
    title: "Pazar Brunch & Tanışma",
    date: "2026-07-12T11:00:00+03:00",
    location: "Moda · Bahçe",
    attendees: 22,
    capacity: 36,
    cover: "/img/events/pazar-brunch-tanisma.jpg",
  },
  {
    id: "rooftop-sarap-peynir",
    category: "food",
    title: "Rooftop Şarap & Peynir Akşamı",
    date: "2026-07-10T20:00:00+03:00",
    location: "Karaköy · Rooftop",
    attendees: 30,
    capacity: 40,
    cover: "/img/events/rooftop-sarap-peynir.jpg",
  },
  {
    id: "founders-breakfast",
    category: "business",
    title: "Founders Breakfast · Networking",
    date: "2026-07-08T09:00:00+03:00",
    location: "Levent · Loft",
    attendees: 41,
    capacity: 50,
    cover: "/img/events/founders-breakfast.jpg",
  },
  {
    id: "luca-006-kadikoy",
    category: "nightlife",
    title: "Luca Night · DJ Set",
    date: "2026-07-11T23:00:00+03:00",
    location: "Kadıköy · Sahne",
    attendees: 210,
    capacity: 300,
    cover: "/img/events/luca-006-kadikoy.jpg",
  },
  {
    id: "luca-camp-2026",
    category: "outdoor",
    title: "Luca Kamp 2026 · Sapanca",
    date: "2026-07-18T14:00:00+03:00",
    location: "Sapanca · Göl Kenarı",
    attendees: 72,
    capacity: 90,
    cover: "/img/events/luca-camp-2026.jpg",
  },
];

export const FAMILY_COUNT = 2418;
export const FAMILY_SAMPLE = Array.from({ length: 8 }, (_, i) => `/img/family-${i + 1}.jpg`);
