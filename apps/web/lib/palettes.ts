// Canlı accent paletleri. Sadece --primary/--ring (marka vurgusu) değişir;
// semantik (başarı/uyarı/hata) + kategori + pano durum renkleri DEĞİŞMEZ.
// HSL string ("H S% L%") olarak tutulur; globals.css hsl(var(--primary)) bekliyor.

export type Palette = {
  id: string;
  name: string;
  desc: string;
  sw: [string, string]; // UI'da gösterilen iki swatch (hex)
  primary: { light: string; dark: string };
};

export const PALETTES: Palette[] = [
  { id: "teal", name: "Teal · Şehir", desc: "canlı · turkuaz", sw: ["#0e9a8c", "#22c9b8"], primary: { light: "174 83% 33%", dark: "174 71% 46%" } },
  { id: "amber", name: "Espresso & Amber", desc: "sıcak · pano", sw: ["#b9822a", "#f6a723"], primary: { light: "35 92% 42%", dark: "38 92% 55%" } },
  { id: "blue", name: "Grafit & Mavi", desc: "nötr · marka mavisi", sw: ["#1f6fd6", "#3b82f6"], primary: { light: "214 84% 48%", dark: "213 90% 62%" } },
  { id: "indigo", name: "Mürekkep & İndigo", desc: "serin · mor-mavi", sw: ["#4f46e5", "#818cf8"], primary: { light: "245 62% 52%", dark: "244 76% 68%" } },
  { id: "copper", name: "Antrasit & Bakır", desc: "butik · el işi", sw: ["#b45a2b", "#e0713a"], primary: { light: "18 78% 44%", dark: "18 86% 60%" } },
  { id: "ice", name: "Kömür & Buz", desc: "göz yormaz · cam", sw: ["#0e8fb0", "#38bdf8"], primary: { light: "195 86% 38%", dark: "199 88% 58%" } },
];

export const DEFAULT_PALETTE = "teal";
export const CUSTOM_ID = "custom";
export const DEFAULT_CUSTOM = "#e0713a";
const KEY = "luca-palette";
const CKEY = "luca-palette-custom";

export function savedPaletteId(): string {
  if (typeof localStorage === "undefined") return DEFAULT_PALETTE;
  return localStorage.getItem(KEY) || DEFAULT_PALETTE;
}
export function savedCustomHex(): string {
  if (typeof localStorage === "undefined") return DEFAULT_CUSTOM;
  return localStorage.getItem(CKEY) || DEFAULT_CUSTOM;
}

/** #rrggbb → "H S% L%" (globals.css hsl(var(--primary)) formatı). */
export function hexToHsl(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return PALETTES[0].primary.dark;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Paleti köke uygular (mevcut açık/koyu temaya göre). */
export function applyPalette(id: string, isDark: boolean) {
  if (typeof document === "undefined") return;
  let v: string;
  if (id === CUSTOM_ID) {
    v = hexToHsl(savedCustomHex());
  } else {
    const p = PALETTES.find((x) => x.id === id) ?? PALETTES[0];
    v = isDark ? p.primary.dark : p.primary.light;
  }
  const root = document.documentElement;
  root.style.setProperty("--primary", v);
  root.style.setProperty("--ring", v);
}

export function persistPalette(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* yok say */
  }
}
export function persistCustom(hex: string) {
  try {
    localStorage.setItem(CKEY, hex);
  } catch {
    /* yok say */
  }
}
