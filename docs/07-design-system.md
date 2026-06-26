# 07 — Tasarım Sistemi

Ton: **premium editorial lifestyle.** Sportif/kalabalık değil; sakin, bol beyaz alan, büyük serif başlıklar.

## Renk paleti
| Rol | Token | Hex |
|---|---|---|
| Arka plan (warm white) | `--bg` | `#F7F5F0` |
| Yüzey (soft beige) | `--surface` | `#E8E1D6` |
| Metin (charcoal) | `--fg` | `#171717` |
| İkincil metin | `--fg-muted` | `#6F6F6F` |
| Kenarlık (light) | `--border` | `#E3DED5` |
| **Vurgu (burnt orange)** | `--accent` | `#C86B42` |
| Alt vurgu (olive) | `--accent-2` | `#657257` |

Dark mode faz 2. Şimdilik açık tema birincil.

## Tipografi
- **Başlık:** Cormorant Garamond veya Playfair Display (serif, editorial)
- **Gövde/UI:** Inter veya Manrope (sans, okunaklı)
- Önerilen: başlık **Cormorant Garamond**, gövde **Manrope**.
- Ölçek: H1 40–56, H2 28–32, H3 20–24, body 15–16, caption 13.

## Component kaynakları
- **Web:** [shadcn/ui](https://ui.shadcn.com/) (temel) + landing efektleri için [Magic UI](https://magicui.design/) / [Aceternity UI](https://ui.aceternity.com/).
- **Mobil:** Expo + Expo Router + NativeWind + [React Native Reusables](https://reactnativereusables.com/) (shadcn'in RN karşılığı → tek tasarım dili). Hazır flow gerekirse NativeWindUI all-access.
- Tam liste hafızada: `ui-component-libraries`.

## Kart tasarımı
- Köşe yarıçapı 16–20px, **çok az gölge**, büyük kapak görseli üstte.
- Alt kısımda: kategori chip → başlık (serif) → tarih/saat · mekân · fiyat · "Son N yer".
- Fazla ikon kullanma; tipografi ve görsel öne çıksın.

## Görsel dili
- Stock fitness görsellerinden KAÇIN.
- Kullan: gün batımı, doğal ışık, gerçek insanlar, topluluk anı, mekân+doğa.
- Tutarlı sıcak/film tonu (warm grade).

## Component envanteri (MVP)
**Web (mevcut + eklenecek):** Button, Badge/Chip, Card, Input, Spotlight, AnimatedGradientText (var) → + EventCard, CategoryFilter, TicketSelector, QRTicket, DatePicker, Stepper (checkout).
**Mobil:** BottomTab (Home/Explore/Tickets/Communities/Profile), EventCard, FilterSheet, BookingSheet, QRScreen, OnboardingInterests.

## Navigasyon (mobil alt menü)
`Home · Explore · My Tickets · Communities · Profile` — ortada artı butonu YOK (kullanıcı etkinlik oluşturmuyor).

## Erişilebilirlik
- Kontrast AA (charcoal/warm-white güçlü).
- Dokunma hedefi min 44×44.
- Burnt-orange sadece vurgu/CTA; metin için kontrastı kontrol et.
