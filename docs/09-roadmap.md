# 09 — Yol Haritası

Build sırası: **Backend → Admin → Web → Mobil.** Her faz bir öncekinin API'sini test eder.

## Faz 0 — Dokümantasyon & temel (BU AŞAMA)
- [x] `docs/` (00–10) + `AGENTS.md`
- [ ] Schema delta migration'ları ([02-domain-model.md](02-domain-model.md)): Category, Event içerik alanları, User onboarding alanları
- [ ] Seed güncelle: kategoriler + örnek etkinlikler (12–20 adet, dolu görünsün)

## Faz 1 — Backend (satış hunisi) ⭐
Öncelik sırası:
1. **`categories`** modülü — migration + CRUD + Event ilişkisi (en hızlı kazanım)
2. **`bookings`** modülü — Order(PENDING) + atomik stok rezerv ($transaction) + idempotencyKey
3. **`payments`** modülü — Iyzico/PayTR provider + webhook (idempotent) + iade
4. **`tickets`/check-in** — QR doğrula + checkedIn + katılımcı listesi/CSV
5. **`/admin/stats`** — dashboard verisi
6. Mevcut `events` admin uçlarını yeni alanlarla (agenda/included/category) genişlet

**Çıktı:** Postman/Swagger'dan uçtan uca: etkinlik aç → bilet al → öde → QR üret → check-in.

## Faz 2 — Admin paneli
- `apps/admin` (Next.js, port 3002) kur
- Dashboard, Etkinlik CRUD (sekmeli form), Katılımcılar+CSV, QR check-in ekranı, Siparişler/İade
- Auth + RolesGuard entegrasyonu (EDITOR/ADMIN/DOOR davranışı)

**Çıktı:** Luca ekibi gerçek etkinlik açıp kapıda QR okutabiliyor.

## Faz 3 — Web sitesi
- Mevcut landing'i koru, üzerine ekle:
- Keşfet (kategori/tarih/fiyat filtre) → Etkinlik detay → Checkout (stepper) → QR bilet
- Auth UI (kayıt/giriş/onboarding ilgi alanı)
- Profil: yaklaşan/geçmiş/biletler/favoriler
- Topluluk listesi (etiket + WhatsApp linki)

**Çıktı:** Public kullanıcı web'den bilet alabiliyor.

## Faz 4 — Mobil (Expo)
- `apps/mobile`: Expo + Expo Router + NativeWind + React Native Reusables
- Onboarding, Home, Explore, Event detail, Booking, My Tickets (QR), Profile, Communities
- Push (Expo Notifications)

**Çıktı:** App Store/Play test sürümü.

## Faz 5+ — Sonrası (MVP dışı)
Favoriler→DB, gerçek Community (üyelik/feed), harita görünümü, kredi/abonelik (Luca Plus), organizatör marketplace, AI öneri, oda arkadaşı eşleştirme. Bkz. [00-product.md](00-product.md) "yapılmayacaklar".

## İlke
- Her faz **çalışır + test edilebilir** bitmeli (yarım bırakıp sonrakine geçme).
- Backend API stabilize olmadan web/mobil'e geçme (yeniden iş riski).
