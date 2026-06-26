# 11 — Güvenlik & Sağlamlık Backlog

Faz 1 backend'inde çok-lensli adversaryal inceleme (concurrency / payment / authz / data) yapıldı. **Kritik bulgular düzeltildi ve gerçek paralel yük altında test edildi.** Bu dosya, bilinçli olarak ertelenen (by-design / admin-only / faz-2) maddeleri kayıt altına alır.

## ✅ Düzeltilenler (inceleme + gerçek-yük testi ile doğrulandı)
| Bulgu | Severity | Fix | Test |
|---|---|---|---|
| Oversell race (read-then-increment, READ COMMITTED) | CRITICAL | `bookings.service`: koşullu `updateMany WHERE sold<=cap-qty` (atomik) | 10 paralel booking / 2 koltuk → tam 2 başarı, sold asla >cap |
| Duplicate tierId ile oversell | CRITICAL | aynı atomik guard (tx içi kendi yazımını görür) | 1 koltuk + 2 dup item → 409, rollback |
| Webhook çift ticket basımı (eşzamanlı) | CRITICAL | `payments.service`: atomik `PENDING→PAID` gate, tek kazanan basar | 2 paralel webhook → tam 2 ticket |
| FAILED/refund çift stok-iadesi | HIGH | atomik status gate (`PENDING→FAILED`, `PAID→REFUNDED`) | — |
| Check-in çift-flip race | MEDIUM | koşullu `updateMany WHERE checkedIn=false` | — |
| CSV formül-injection | HIGH | `=,+,-,@,\t,\r` ile başlayanlara `'` öneki | — |
| `mock/pay` prod'da bedava bilet | HIGH | `NODE_ENV==='production'` → 404 | — |
| `/me/bookings`,`/me/tickets` hep boş | HIGH | userId **veya** email eşleşmesi (guest checkout'u hesaba bağlar) | viewer booking → /me/bookings görüyor |
| `GET /bookings/:code` PII sızıntısı | HIGH | public yanıttan phone/fullName çıkarıldı, email maskelendi | `vi****@luca.test`, phone/fullName yok |
| Category delete sessiz orphan (SET NULL) | MEDIUM | silmeden önce event count-check → 409 | referanslıda 409, boşta 200 |
| qty üst sınırsız / totalMinor overflow | HIGH→LOW | DTO `@Max(50)` + isim/tel `@MinLength` | qty 999 → 400 |

## ⏳ Ertelenenler (faz-2 / by-design — bilinçli)

### Payment
- **Çok-sağlayıcılı webhook yönlendirme.** `handleWebhook` şu an global default provider (`mock`) kullanır; `order.provider`'ı dikkate almaz. Gerçek Iyzico eklenince sağlayıcı-başına webhook endpoint'i (`/payments/webhook/iyzico`) veya payload/header'dan sağlayıcı tespiti gerekir. MVP'de mock olduğu için zararsız.
- **CANCELED event'e geç PAID webhook hâlâ ticket basar.** İptal akışı (event CANCELED → açık order'lar iade) henüz yok. PAID gate'e event-status kontrolü eklenebilir.
- ✅ **Abandoned PENDING order temizliği (cron) YAPILDI** (Faz 1.5): JobsService 20dk TTL → CANCELED + stok iade.

### ✅ Güvenlik sertleştirme geçişi (2026-06-25) — YAPILDI & test edildi
- ✅ **Deny-by-default global auth.** Global `JwtAuthGuard` + `RolesGuard` (APP_GUARD); her route `@Public` olmadıkça JWT ister → koruma unutma riski bitti. Tüm public uçlar denetlendi (health dahil).
- ✅ **JWT canlı kontrol.** `JwtStrategy.validate` her istekte DB'den isActive+varlık kontrol eder → deaktive/silinen kullanıcı **anında** erişim kaybeder; rol değişimi anında geçerli (15dk beklemeden). *(test: deaktive→401, reaktive→200)*
- ✅ **Audit log.** `AuditInterceptor` tüm `/admin/*` + refund mutasyonlarını AuditLog'a yazar (actor+action+entity; body/secret ASLA). *(test: POST+DELETE kaydedildi)*
- ✅ **Login brute-force iki katman.** IP throttle (10/dk, mevcut) + email lockout (5 hata → 15dk kilit, in-memory). *(test: 401×5→429 lockout)*
- ✅ **500 hata sızıntısı engellendi.** Prod'da 5xx istemciye 'Internal server error' döner; gerçek hata sadece sunucu log'unda.
- ✅ **Güvenlik başlıkları** (helmet): HSTS, X-Content-Type-Options nosniff, X-Frame-Options SAMEORIGIN.

### ✅ Adversaryal güvenlik incelemesi (2026-06-25) — bulgular düzeltildi
Bağımsız güvenlik auditi yapıldı; çoğu alan sağlam bulundu. Bulunan + DÜZELTİLENLER:
- ✅ **[KRİTİK] Public webhook bedava bilet.** Prod'da `PAYMENT_PROVIDER=mock` default + mock `verifyWebhook=true` → kimliksiz `POST /payments/webhook {status:PAID}` ile bedava bilet. **Fix:** mock `verifyWebhook` prod'da `false`; `getProvider` bilinmeyen sağlayıcıda fail-closed (mock'a sessiz düşmez); prod'da mock yasak. *(dev test: webhook 201; prod: 401)*
- ✅ **[MEDIUM] Token log sızıntısı.** SMTP yapılandırılmamışsa reset/verify linkleri (token'lı) log'a düşüyordu. **Fix:** prod'da body asla loglanmaz, yalnız metadata; tam body sadece dev.
- ✅ **[LOW] Token tüketiminde isActive.** verify/reset artık deaktive hesapta token'ı reddeder.
- ⬜ **[LOW] Register enumeration.** `register` mevcut email'de "Email already used" döndürür (forgot/resend enumeration-safe ama register değil). Tradeoff kabul edildi; istenirse register nötr yanıta çevrilir.
- **Sağlam bulunanlar:** global authz (hiçbir admin route @Public/Roles eksik değil), Settings secret maskeleme+AES-GCM, JWT canlı kontrol, audit body sızdırmıyor, mass-assignment yok, IDOR yok, reviews PAID-check bypass edilemez (self email-change API'si yok).

### Kalan authz notları
- **Attendee email'i DOOR rolüne görünür.** DOOR güvenilir personel; gerekirse DOOR görünümünden email çıkarılabilir.
- **2FA (TOTP) adminler için.** `twoFaSecret` alanı var, akış yok — yüksek-değerli admin hesapları için eklenebilir.
- **Brute-force lockout in-memory** (tek-instance). Çok-instance için Redis'e taşınmalı.

### Data
- **Admin event create/update geçersiz FK → 500.** Hatalı `venueId/categoryId/heroMediaId` ham 500 verir (admin-only girdi). P2003 → 400'e sarılabilir.
- **idempotencyKey + farklı payload → orijinali döner.** Standart idempotency semantiği (aynı key = aynı sonuç). İstenirse key+body uyuşmazlığında 409 verilebilir.
- **Reservation kapasite/çakışma guard'ı yok.** By-design: rezervasyon talep + manuel admin onayı ([10-decisions.md](10-decisions.md) ADR-012). Sert kapasite gerekiyorsa eklenir.

## Test kullanıcıları (seed)
`admin@luca.test` (SUPERADMIN) · `editor@luca.test` (EDITOR) · `door@luca.test` (DOOR) · `viewer@luca.test` (VIEWER) — hepsi şifre `password123`.
