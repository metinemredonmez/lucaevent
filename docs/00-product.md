# 00 — Ürün

## Tek cümle
**Luca**, şehirdeki premium yaşam etkinliklerini (wellness, outdoor, workshop, kamp, sosyal, nightlife) keşfettiğin, bilet alıp QR ile giriş yaptığın küratörlü bir etkinlik & biletleme platformudur.

## Ne DEĞİL
Luca bir gece kulübü uygulaması değil. Aynı zamanda şunların **hiçbiri değil** (en azından MVP'de):
- SweatPals/Meetup tarzı kullanıcı-üretimli topluluk marketplace'i
- ClassPass tarzı çok-stüdyolu kredi/abonelik ağı
- Tinder tarzı eşleşme / kullanıcılar arası mesajlaşma
- Eğitmenlerin kendi etkinliğini açıp sattığı açık marketplace

Bunlar **gelecek fazların** konusu. MVP, **Luca'nın kendi küratörlü etkinliklerini** yöneten kapalı bir platformdur. Detaylı gerekçe: [10-decisions.md](10-decisions.md).

## Konumlandırma
> "Etkinlikten fazlası. Bir yaşam topluluğu."
> *More than events. A lifestyle community.*

Tasarım tonu premium/editorial — sportif veya kalabalık değil. Bkz. [07-design-system.md](07-design-system.md).

## Önemli: gece kulübü kaybolmuyor, ŞEMSİYE oluyor
Canlı site ([lucaclub.com.tr](https://lucaclub.com.tr/)) bugün saf bir gece kulübü: Beyoğlu, 7 mekân (Lounge, Dance Floor, VIP, Live Set, Rooftop, After Party, Private Event), masa/alan rezervasyonu. **Bu taraf SİLİNMİYOR** — Luca'nın "Nightlife" dikeyi olarak kalıyor. Üstüne **event + gezi + eğlence + spor + wellness** dikeyleri ekleniyor. Yani Luca = gece kulübü DEĞİL; gece kulübünü de İÇİNDE barındıran bir yaşam/etkinlik platformu.

## Dikeyler (kullanıcıya görünen ana eksenler)
Luca tek bir tür değil — şu dikeyleri kapsar:
1. **Wellness** — yoga, pilates (mat/reformer), nefes, meditasyon, sound healing, cold plunge/ice bath
2. **Outdoor & Spor** — hiking, run club, bisiklet, SUP, tırmanış, tekne, yelken, fonksiyonel antrenman, boks
3. **Gezi & Seyahat** — günübirlik tur, tekne turu, gastronomi turu, kamp/retreat, glamping, wellness weekend, ski weekend
4. **Workshop** — seramik, resim, mum, kahve/kokteyl, fotoğraf, dans, yemek, AI/girişimcilik
5. **Social** — piknik, tanışma kahvaltısı, brunch, networking, film/oyun gecesi, kitap kulübü
6. **Food & Drink** — rooftop dinner, tadım, özel yemek deneyimi
7. **Business & Networking** — founders breakfast, creator meetup, kurumsal
8. **Nightlife** — mevcut gece kulübü: DJ set, konser, parti, after, VIP masa

## Etkinlik tipleri (EventKind — teknik tip)
- **PARTY** — tek mekânlı gece / sosyal etkinlik
- **CAMP** — çok günlü outdoor / retreat / kamp (konaklamalı)
- **TRIP** — günübirlik gezi / tur (tekne, gastronomi, şehir turu) *(eklenecek)*
- **CONCERT** — konser / DJ set
- **SHOWCASE** — özel gösteri / lansman

> **Ayrım:** `EventKind` = teknik akış (kamp çok günlü, tur tek günlü vb.). `Category` (yukarıdaki 8 dikey) = pazarlama/keşfet filtresi. İkisi farklı eksen. Bkz. [02-domain-model.md](02-domain-model.md), [10-decisions.md](10-decisions.md) ADR-005.

## İki farklı akış: Bilet vs Rezervasyon
- **Etkinlik bileti** (yoga/kamp/workshop/konser): kontenjanlı, ücretli, QR'lı — ana akış. Bkz. [03-logic-flows.md](03-logic-flows.md).
- **Mekân/masa rezervasyonu** (gece kulübü VIP/Lounge masası): tarih+kişi sayısı+alan seç, bilet değil. Mevcut sitedeki "Rezervasyon" bu. MVP'de basit tutulur; detay ADR-012.

## MVP kapsamı (yapılacaklar)
**Kullanıcı tarafı**
- Kayıt / giriş (e-posta + şifre, JWT)
- Onboarding: ilgi alanı seçimi (kişiselleştirme)
- Ana sayfa: This Weekend / Popular / Luca Originals / Upcoming Camps & Trips / Last Spots
- Keşfet: kategori + tarih + konum + fiyat filtreleri
- Etkinlik detay: program (agenda), eğitmen, dahil olanlar, lineup, mekân
- Bilet alma: tier seç → ödeme (Iyzico/PayTR) → QR bilet
- Profil: yaklaşan/geçmiş etkinlikler, biletler, favoriler
- Topluluk: sadece **etiket + WhatsApp grup linki** (gerçek topluluk sistemi değil)

**Yönetim tarafı (admin)**
- Etkinlik CRUD + publish/unpublish
- TicketTier yönetimi, kontenjan
- Katılımcı listesi + CSV export
- QR check-in (DOOR rolü)
- Dashboard: satış, doluluk, popüler etkinlik

## MVP'de YAPILMAYACAKLAR
- Kullanıcılar arası mesajlaşma / sosyal feed / story
- Oda arkadaşı eşleştirme (kamp)
- Kredi/puan sistemi, dinamik fiyatlama
- Açık organizatör marketplace'i, eğitmen ödeme sistemi
- Canlı harita (faz 2 — kart görünümü yeterli)
- AI öneri motoru

## Hedef kullanıcı
- **Birincil:** 25–40 yaş, İstanbul, wellness/outdoor/sosyal etkinliklere ilgili, premium deneyim arayan.
- **Organizatör:** şimdilik sadece Luca ekibi (admin paneli kullanan iç ekip).

## Başarı kriteri (MVP)
1. Bir kullanıcı sıfırdan kayıt olup bilet alıp QR ile giriş yapabiliyor.
2. Admin etkinlik açıp satışı görüp kapıda QR okutabiliyor.
3. Ödeme gerçek (Iyzico/PayTR), webhook idempotent, overselling yok.
