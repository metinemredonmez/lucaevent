# 10 — Kararlar (ADR)

Mimari/ürün kararları ve gerekçeleri. Yeni karar = yeni satır.

## ADR-001 — 10-uygulama mashup YAPILMAYACAK
**Karar:** SweatPals + Meetup + ClassPass + Tripaneer + Fever mashup'ı kurulmayacak. MVP = Luca'nın kendi küratörlü etkinliklerini satan kapalı platform.
**Neden:** O kapsam 1–2 yıllık iş; MVP'yi süresiz geciktirir. Mevcut backend zaten "etkinlik + biletleme" iskeleti — doğru yön bu. Topluluk/marketplace/eşleşme net şekilde faz dışı.
**Sonuç:** Topluluk MVP'de feature değil, etiket + WhatsApp linki.

## ADR-002 — Build sırası: Backend → Admin → Web → Mobil
**Karar:** Önce backend, sonra admin, sonra web, en son mobil.
**Neden:** Admin backend'i biten anda test eder (etkinlik aç → sat → kapıda oku). Web+mobil aynı API'yi tüketir; API stabilize olmadan onlara geçmek yeniden iş doğurur.

## ADR-003 — Para birimi minor unit (Int)
**Karar:** Tüm para `*Minor` (kuruş) `Int`. 750 TL = 75000.
**Neden:** Float yuvarlama hataları para işinde kabul edilemez. Schema zaten böyle (`priceMinor`, `totalMinor`).

## ADR-004 — Eğitmen için ayrı Instructor modeli YOK (şimdilik)
**Karar:** Wellness eğitmenleri MVP'de mevcut `Artist` + `Lineup` ile temsil edilir.
**Neden:** `Artist` (name, bio, avatarUrl, instagram, isResident) eğitmenle %90 örtüşüyor. Ayrı model = çift bakım. Gerçek ihtiyaç çıkarsa faz 2'de `Instructor`.

## ADR-005 — Category, EventKind'den ayrı
**Karar:** `EventKind` (PARTY/CAMP/CONCERT/SHOWCASE) teknik tip kalır; kullanıcıya görünen filtreler ayrı `Category` modeli (Wellness/Outdoor/Workshop...).
**Neden:** EventKind bilet/akış mantığını sürer (kamp çok günlü vb.); Category pazarlama/keşfet ekseni. İkisi farklı eksen, karıştırmak ileride sınırlar.

## ADR-006 — Admin ayrı app (`apps/admin`)
**Karar:** Admin, `web` içinde route grubu değil, ayrı Next.js app (port 3002).
**Neden:** Yetki izolasyonu (admin kodu public bundle'a sızmasın), farklı tasarım dili, bağımsız deploy. Maliyet: ek app — kabul edilebilir.
**GÜNCELLEME (2026-06-25):** Ağ sandbox'ta yeni paket inmediği için (yeni `apps/admin` deps kurulamıyor) admin GEÇİCİ olarak `apps/web/app/admin` route grubunda kuruldu — mevcut Next/Tailwind/shadcn reuse. Ağ açılınca ayrı `apps/admin`'e taşınabilir. login+layout+dashboard+etkinlik/kategori/kupon/ayarlar/check-in çalışıyor.

## ADR-007 — Ödeme webhook idempotent + sunucu tarafı tutar
**Karar:** Webhook idempotent (PAID order'a no-op); tutar her zaman sunucuda yeniden hesaplanır; imza zorunlu.
**Neden:** Sağlayıcılar webhook'u tekrarlar → çift bilet riski. İstemciden tutar almak = manipülasyon riski. Bkz. [06-payments.md](06-payments.md).

## ADR-008 — Bilet stoğu tek transaction'da
**Karar:** `bookings` içinde stok kontrolü + `sold += qty` tek `$transaction`.
**Neden:** Eşzamanlı son-bilet yarışında overselling'i ancak atomik işlem önler.

## ADR-009 — Tasarım: premium editorial
**Karar:** Cormorant/Playfair serif + Inter/Manrope; charcoal/warm-white + burnt-orange. Web shadcn/ui, mobil React Native Reusables.
**Neden:** Premium lifestyle konumlandırması; sportif/kalabalık UI markayı ucuzlatır. Web+mobil aynı dil → tek tasarım sistemi.

## ADR-011 — Gece kulübü silinmez, dikey olur (umbrella model)
**Karar:** Mevcut canlı site (lucaclub.com.tr — Beyoğlu gece kulübü, 7 mekân) kaldırılmaz. "Nightlife" Luca'nın 8 dikeyinden biri olur; üstüne Wellness / Outdoor & Spor / Gezi & Seyahat / Workshop / Social / Food & Drink / Business eklenir.
**Neden:** Emre net söyledi — "sadece gece kulübü değil; event, gezi, eğlence, spor da var." Mevcut marka/trafik korunmalı. Luca = gece kulübünü de içeren yaşam platformu.
**Sonuç:** Kategori taksonomisi 8 dikeye genişletildi ([00-product.md](00-product.md)); EventKind'e TRIP eklendi.

## ADR-012 — Bilet ile Mekân Rezervasyonu ayrı akış
**Karar:** İki ayrı akış var: (1) **Etkinlik bileti** (kontenjan + ödeme + QR) ana akış; (2) **Mekân/masa rezervasyonu** (gece kulübü VIP/Lounge masası — tarih + kişi + alan) ayrı `Reservation` modeli, basit talep+onay.
**Neden:** Masa rezervasyonu bilet değil — kontenjan/QR mantığı farklı, fiyatlama çoğu zaman yok veya minimum harcama. İkisini tek modele sıkıştırmak akışları bozar. Mevcut sitedeki "Rezervasyon" sekmesi bu.
**Sonuç:** `Reservation` modeli MVP'de basit (form + admin onay, ödeme opsiyonel); ana satış hunisi bilet tarafı kalır. Faz 1 sonu / faz 2.

## ADR-013 — Entegrasyon ayarları admin panelden (DB), manuel .env değil
**Karar:** Entegrasyon/iş yapılandırması (Google client id, OneSignal app id/key, Iyzico/PayTR, SMTP, feature flag'ler) DB'de `Setting` modelinde tutulur ve **admin panelden** yönetilir. Servisler `ConfigService` yerine cache'li `SettingsService`'ten okur (DB → yoksa env fallback). Admin'de güncellenince anında DB'ye yazılır.
**Neden:** Emre env ile uğraşmak istemiyor — "ileride env ile uğraşmayız, admin'de güncelleyince kendi yazar." Operasyon kolaylığı; teknik olmayan ekip deploy gerektirmeden değiştirir; tek yerden yönetim.
**İSTİSNA:** Bootstrap secret'ları (DATABASE_URL, REDIS_URL, JWT secret) env'de KALIR — DB'ye erişmeden gerekli. Secret değerler DB'de şifreli saklanır, API'de maskeli döner.
**Sonuç:** Faz 2 (admin) ile `Setting` + `SettingsService` + "Ayarlar/Entegrasyonlar" ekranı gelir; mevcut Google/OneSignal/payments servisleri SettingsService okuyacak şekilde refactor edilir. İstenirse Faz 1.5'te altyapı önden kurulur. (Hafıza: [[admin-managed-settings]].)

## ADR-010 — Docker yalnız altyapı
**Karar:** Docker sadece Postgres/Redis/Mailpit/MinIO; back/front lokalde koşar.
**Neden:** Emre'nin yerleşik dev akışı; hızlı iterasyon. (Hafıza: local-dev-docker-infra.)
