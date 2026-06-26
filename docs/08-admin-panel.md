# 08 — Admin Paneli

Ayrı Next.js app (`apps/admin`, port 3002) — aynı API'yi tüketir. Rol: EDITOR+ (bkz. [05-roles-permissions.md](05-roles-permissions.md)). Build sırasında **web'den önce** gelir ([09-roadmap.md](09-roadmap.md)).

## Neden ayrı app
- Yetki izolasyonu (admin bundle public web'e sızmaz).
- Farklı tasarım (yoğun tablo/form UI vs. editorial public site).
- Bağımsız deploy.

## Ekranlar

### 1. Dashboard (`/`)
Kartlar: toplam etkinlik, toplam satış (TRY), yaklaşan rezervasyon, doluluk oranı, en popüler etkinlik, iptal oranı. Kaynak: `GET /admin/stats`.

### 2. Etkinlikler (`/events`)
- Tablo: başlık, kind, tarih, status (renkli badge), satılan/kapasite, aksiyonlar.
- Filtre: status, kind, tarih.
- Aksiyon: oluştur, düzenle, publish/unpublish, arşivle.

### 3. Etkinlik oluştur/düzenle (`/events/new`, `/events/:id`)
Sekmeli form:
- **Genel:** başlık, slug (otomatik), kind, kategori, tagline, açıklama, kapak görseli
- **Zaman & Yer:** startsAt/endsAt/doorsAt, venue seç
- **Program:** agenda (satır satır: saat + başlık), included, bringList
- **Lineup:** artist/eğitmen ekle (sıra, headline)
- **Biletler:** TicketTier'lar (ad, fiyat, kapasite, satış penceresi, status)
- **Kamp (kind=CAMP ise):** campingAllowed, campMapUrl, travelInfo, faq
- **SEO:** seoTitle, seoDesc
- Aksiyon: Taslak kaydet / Yayınla (yetkiye göre).

### 4. Katılımcılar (`/events/:id/attendees`)
- Tablo: ad, e-posta, telefon, bilet tipi, ödeme durumu, check-in durumu.
- Arama (ad/e-posta), filtre (check-in olan/olmayan).
- **CSV export** (`/admin/events/:id/attendees.csv`).

### 5. QR Check-in (`/events/:id/door`)
- DOOR rolü için. Mobil uyumlu, kamera ile QR okut.
- Sonuç: yeşil "Giriş OK ✓" / sarı "Zaten kullanıldı" / kırmızı "Geçersiz".
- Manuel arama (kamera yoksa isimle bul → işaretle).
- Canlı sayaç: giren / toplam.

### 6. Mekânlar (`/venues`) & Sanatçılar (`/artists`)
Basit CRUD tablolar.

### 7. Siparişler & İade (`/orders`)
- Sipariş listesi, durum filtresi.
- Detay → iade (ADMIN). Bkz. [06-payments.md](06-payments.md).

### 8. Kategoriler (`/categories`)
Sıralı liste, renk/ikon, drag-reorder (faz 2).

## Tasarım
shadcn/ui + Tremor (dashboard grafikleri). Yoğun, fonksiyonel; public sitenin editorial tonundan ayrı. Tablo + form ağırlıklı.

## Yetki davranışı
- EDITOR publish/iade butonlarını **görmez** (sadece taslak kaydeder).
- DOOR yalnız `/events/:id/door` ve katılımcı listesine erişir.
- Tüm yazma işlemleri AuditLog'a düşer.
