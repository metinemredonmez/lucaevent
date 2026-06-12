import type { LucideIcon } from "lucide-react";
import {
  Music2,
  Disc3,
  Wine,
  Sparkles,
  Crown,
  Flame,
  Star,
} from "lucide-react";

export type CategorySlug =
  | "lounge"
  | "dance"
  | "vip"
  | "live"
  | "rooftop"
  | "afterparty"
  | "private";

export interface Category {
  slug: CategorySlug;
  name: string;
  emoji: string;
  tagline: string;
  icon: LucideIcon;
  /** accent color for category mode (hex) */
  accent: string;
  cover: string;
}

export const CATEGORIES: Category[] = [
  {
    slug: "lounge",
    name: "Lounge",
    emoji: "🥃",
    tagline: "Sakin başla",
    icon: Wine,
    accent: "#A855F7",
    cover: "/img/cat-gurme.jpg",
  },
  {
    slug: "dance",
    name: "Dance Floor",
    emoji: "💿",
    tagline: "Gece ısınır",
    icon: Disc3,
    accent: "#C026D3",
    cover: "/img/cat-parti.jpg",
  },
  {
    slug: "vip",
    name: "VIP",
    emoji: "👑",
    tagline: "Sahnenin yanı",
    icon: Crown,
    accent: "#7C3AED",
    cover: "/img/cat-ladies.jpg",
  },
  {
    slug: "live",
    name: "Live Set",
    emoji: "🎷",
    tagline: "Sahnede canlı",
    icon: Music2,
    accent: "#9333EA",
    cover: "/img/cat-spontane.jpg",
  },
  {
    slug: "rooftop",
    name: "Rooftop",
    emoji: "🌃",
    tagline: "Şehrin üstünde",
    icon: Sparkles,
    accent: "#D946EF",
    cover: "/img/cat-gezi.jpg",
  },
  {
    slug: "afterparty",
    name: "After Party",
    emoji: "🔥",
    tagline: "Gece bitmiyor",
    icon: Flame,
    accent: "#8B5CF6",
    cover: "/img/cat-kamp.jpg",
  },
  {
    slug: "private",
    name: "Private Event",
    emoji: "✨",
    tagline: "Sadece davetlilere",
    icon: Star,
    accent: "#A21CAF",
    cover: "/img/cat-form.jpg",
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

export const UPCOMING_ACTIVITIES: Activity[] = [
  {
    id: "1",
    category: "dance",
    title: "Opening Night · DJ Set",
    date: "2026-06-13T23:00:00+03:00",
    location: "Luca · Ana Salon",
    attendees: 180,
    capacity: 300,
    cover: "/img/activity-1.jpg",
  },
  {
    id: "2",
    category: "live",
    title: "Saxophone & House · Live Set",
    date: "2026-06-14T22:30:00+03:00",
    location: "Luca · Sahne",
    attendees: 96,
    capacity: 200,
    cover: "/img/activity-2.jpg",
  },
  {
    id: "3",
    category: "rooftop",
    title: "Sunset Session · Rooftop",
    date: "2026-06-20T19:00:00+03:00",
    location: "Luca · Çatı Katı",
    attendees: 42,
    capacity: 90,
    cover: "/img/activity-3.jpg",
  },
  {
    id: "4",
    category: "vip",
    title: "Members Only · Friday",
    date: "2026-06-21T23:30:00+03:00",
    location: "Luca · VIP Salonu",
    attendees: 28,
    capacity: 40,
    cover: "/img/activity-4.jpg",
  },
  {
    id: "5",
    category: "lounge",
    title: "Mezze & Cocktails Akşamı",
    date: "2026-06-22T20:00:00+03:00",
    location: "Luca · Lounge",
    attendees: 52,
    capacity: 80,
    cover: "/img/activity-5.jpg",
  },
  {
    id: "6",
    category: "afterparty",
    title: "After Hours · Underground",
    date: "2026-06-28T03:00:00+03:00",
    location: "Luca · Alt Kat",
    attendees: 76,
    capacity: 120,
    cover: "/img/activity-6.jpg",
  },
];

export const FAMILY_COUNT = 2418;
export const FAMILY_SAMPLE = Array.from({ length: 8 }, (_, i) => `/img/family-${i + 1}.jpg`);
