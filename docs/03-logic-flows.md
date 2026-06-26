# 03 — Logic Flows ⭐

Uygulamanın çekirdek mantığı. Tüm istemciler (admin/web/mobil) bu kurallara uyar.

## 1. Event yaşam döngüsü
```
DRAFT ──(içerik tamam)──► SCHEDULED ──(publish)──► PUBLISHED
  ▲                                                    │
  └──────────(unpublish)───────────────────────────────┘
                                                       │
PUBLISHED ──(iptal)──► CANCELED                        │
PUBLISHED ──(geçmiş/arşiv)──► ARCHIVED ◄───────────────┘
```
**Kurallar**
- Yalnız `PUBLISHED` etkinlikler public API'de (`GET /events`) görünür. (Mevcut `EventsService.listPublic` bunu uyguluyor.)
- `SCHEDULED` = içerik hazır ama yayın zamanı gelmemiş (ileride otomatik publish job'ı).
- `CANCELED` → açık `Order`'lar iade akışına girer ([06-payments.md](06-payments.md)).
- `range=upcoming` → `startsAt >= now`, `range=past` → `startsAt < now`.

## 2. Order / bilet yaşam döngüsü
```
        ┌──────────────────────────────────────────────┐
sepet ─►│ PENDING │                                      │
        └────┬────┘                                      │
   ödeme OK  │   ödeme FAIL   webhook timeout            │
      ┌──────┼────────┬──────────────┐                   │
      ▼      │        ▼              ▼                    │
   ┌──────┐  │     ┌──────┐      ┌─────────┐             │
   │ PAID │  │     │FAILED│      │CANCELED │ (stok iade) │
   └──┬───┘  │     └──────┘      └─────────┘             │
      │ iade │                                            │
      ▼      │                                            │
  ┌────────┐ │                                            │
  │REFUNDED│ │                                            │
  └────────┘ └────────────────────────────────────────────┘
```
- `PENDING` → ödeme bekleniyor, stok **rezerve** edilmiş.
- `PAID` → `IssuedTicket`'lar üretilir, QR aktif.
- `FAILED` / `CANCELED` → rezerve stok geri verilir (`TicketTier.sold -= qty`).
- `REFUNDED` → PAID sonrası iade; biletler iptal (`IssuedTicket` invalidate).

## 3. Bilet alma akışı (overselling'e karşı)
> En kritik akış. Stok düşümü **tek transaction** içinde, satılan miktar kontrolüyle.

```
1. İstemci → POST /bookings { eventId, items:[{tierId, qty}], buyer }
2. API $transaction BAŞLAT:
   a. her tier için: SELECT ... (kilitli okuma)
   b. tier.status == ACTIVE && satış penceresi açık mı?  değilse → 409
   c. tier.sold + qty <= tier.capacity ?  değilse → 409 SOLD_OUT
   d. tier.sold += qty   (rezerv)
   e. Order(PENDING) + OrderItem'lar yarat, totalMinor hesapla
   $transaction BİTİR
3. Ödeme sağlayıcıya checkout oturumu aç → URL/token döndür
4. İstemci ödeme sayfasına gider
5. (webhook) POST /payments/webhook  →  bkz. madde 4
```
**Idempotency:** aynı `bookings` isteği iki kez gelirse client-side `idempotencyKey` ile tekrar Order yaratma engellenir.

## 4. Ödeme webhook akışı (idempotent)
```
1. Sağlayıcı → POST /payments/webhook (imzalı payload)
2. İmza doğrula (HMAC). Geçersizse → 401, işleme alma.
3. providerId ile Order bul.
4. Order zaten PAID mi?  evet → 200 OK döndür, HİÇBİR ŞEY yapma (idempotent!)
5. Order PENDING → PAID, paidAt=now
6. her OrderItem.qty kadar IssuedTicket yarat (code = imzalı/rastgele, tahmin edilemez)
7. Mail/SMS ile QR bilet gönder
8. 200 OK
```
Webhook gelmezse: cron job N dakika sonra PENDING order'ı `CANCELED` yapar + stok iade.

## 5. Check-in akışı (kapı / DOOR rolü)
```
1. DOOR kullanıcı → admin/mobil → QR okut → POST /tickets/check-in { code }
2. IssuedTicket'ı code ile bul.  yoksa → "Geçersiz bilet"
3. İlgili Order PAID mi?  değilse → "Ödenmemiş bilet"
4. Etkinlik bugün/geçerli mi?  değilse → uyarı
5. checkedIn == false mi?
     evet → checkedIn=true, checkedInAt=now, checkedInBy=userId → "Giriş OK ✓"
     hayır → "Bu bilet zaten kullanıldı (saat XX:XX)" ⚠
```

## 6. Onboarding / kişiselleştirme
```
kayıt → e-posta doğrula → ilgi alanı seç (interests[]) → ana sayfa
ana sayfa sıralaması: interests ile eşleşen kategoriler öne çıkar
```

## 7. Kamp (CAMP) farkı
PARTY ile aynı bilet mantığı + ek alanlar gösterilir: konaklama/oda tipi (TicketTier adıyla: "Single Room", "Shared Room", "Bring Your Own Tent"), ulaşım (`travelInfo`), günlük program (`agenda`), `campMapUrl`. Oda arkadaşı eşleştirme **MVP'de yok**.

## Hata durumları (özet)
| Durum | Kod | Mesaj |
|---|---|---|
| Tier sold out | 409 | "Bu bilet tükendi" |
| Satış penceresi kapalı | 409 | "Satış henüz açık değil / kapandı" |
| Geçersiz webhook imzası | 401 | sessiz |
| Çift QR check-in | 200 + uyarı | "Bilet zaten kullanıldı" |
| Yetkisiz işlem | 403 | rol matrisine göre |
