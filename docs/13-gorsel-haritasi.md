# 13 — Görsel Haritası (Pexels indirme listesi)

Pexels'ten (ücretsiz, ticari kullanım serbest) indirip **bu isimlerle** kaydet. Bırak, ben `coverUrl`/UI'ya bağlayayım.

**Kurallar:** yatay (landscape) ~**1600×1000**, sıcak/doğal ton (stok-fitness klişesinden kaçın), JPG tercih (PNG de olur). Klasör: `apps/web/public/img/...` (yoksa oluştur).

## 0. Hero geçiş görselleri (EN ÖNEMLİ) → `public/img/hero/`
Homepage hero'da **crossfade ile geçen** atmosferik event fotoğrafları. Mor-dark overlay altında duracak, o yüzden **karanlık/atmosferik** olanları seç (ışık, kalabalık, gün batımı). 5 adet:
| Dosya | Pexels'te ara |
|---|---|
| `hero-1.jpg` | "concert crowd lights night", "music festival night" |
| `hero-2.jpg` | "rooftop party sunset people", "open air party golden hour" |
| `hero-3.jpg` | "sunrise yoga retreat", "wellness morning calm" |
| `hero-4.jpg` | "campfire friends festival night", "outdoor camp lights" |
| `hero-5.jpg` | "people dancing silhouette lights", "celebration crowd energy" |

## 1. Etkinlik kapakları → `public/img/events/<dosya>`
| Dosya adı | Pexels'te ara | Dikey |
|---|---|---|
| `sunset-yoga-sound-healing.jpg` | "sunset yoga", "yoga sea calm" | 🧘 Wellness |
| `sabah-reformer-pilates.jpg` | "reformer pilates", "pilates studio" | 🧘 Wellness |
| `belgrad-sabah-kosusu.jpg` | "morning run forest", "running group park" | 🏃 Outdoor |
| `bogaz-gun-batimi-tekne.jpg` | "bosphorus boat sunset", "yacht deck sunset" | ✈️ Gezi |
| `seramik-atolyesi-kupa.jpg` | "pottery workshop hands", "ceramics studio" | 🎨 Workshop |
| `pazar-brunch-tanisma.jpg` | "brunch table friends", "healthy brunch overhead" | ☕ Social |
| `rooftop-sarap-peynir.jpg` | "wine cheese tasting", "rooftop wine evening" | 🍽️ Food |
| `founders-breakfast.jpg` | "networking breakfast", "business meeting coffee" | 💼 Business |
| `luca-006-kadikoy.jpg` | "dj night club lights", "concert crowd night" | 🎶 Nightlife |
| `luca-camp-2026.jpg` | "forest camp festival", "glamping tent nature" | ⛺ Kamp |

## 2. Kategori kartları → `public/img/categories/<slug>.jpg`
8 dikey için birer kapak (keşfet sayfasındaki kategori kartları):
`wellness.jpg` (yoga/meditasyon) · `outdoor-spor.jpg` (hiking/koşu) · `gezi-seyahat.jpg` (tekne/yol) · `workshop.jpg` (atölye/el işi) · `social.jpg` (arkadaş grubu) · `food-drink.jpg` (sofra/içecek) · `business.jpg` (networking) · `nightlife.jpg` (DJ/gece)

## 3. Ana sayfa hero → `public/img/`
| Dosya | Ara |
|---|---|
| `hero.jpg` | "people event golden hour", "rooftop gathering sunset" — geniş, atmosferik |
| `og-cover.jpg` | sosyal medya paylaşım görseli (1200×630) — hero'nun kırpılmışı olur |

## 4. (Opsiyonel) Eğitmen/avatar → `public/img/instructors/`
Yoga/pilates eğitmenleri için portre (varsa): `<slug>.jpg`. Yoksa baş harf avatar kullanılır.

## Notlar
- **Auth ekranlarına görsel GEREKMEZ** — split-screen sol panel charcoal + dekoratif daire (zaten yapıldı).
- Dosyaları bıraktığında: seed `coverUrl = /img/events/<slug>.jpg` olarak güncellenir, keşfet/detay/landing bunları kullanır.
- Telif: yalnız Pexels/Unsplash gibi ücretsiz-ticari kaynaklar; rastgele Google görseli kullanma.
