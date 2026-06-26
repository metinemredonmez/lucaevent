# 06 — Ödeme

Sağlayıcı: **Iyzico** (birincil) veya **PayTR**. Türkiye, 3D Secure, taksit. Soyutlama ile tek `PaymentProvider` arayüzü arkasında.

## Soyutlama
```ts
interface PaymentProvider {
  createCheckout(order: Order): Promise<{ checkoutUrl: string; providerId: string }>;
  verifyWebhook(raw: Buffer, headers): boolean;   // imza doğrulama
  parseWebhook(raw): { providerId: string; status: 'PAID'|'FAILED' };
  refund(providerId: string, amountMinor: number): Promise<void>;
}
```
`provider` alanı `Order.provider`'da saklanır → iade doğru sağlayıcıya gider.

## Checkout akışı
```
1. /bookings → Order(PENDING) + stok rezerv (bkz. 03-logic-flows §3)
2. provider.createCheckout(order) → checkoutUrl + providerId
3. Order.providerId kaydet
4. İstemciyi checkoutUrl'e yönlendir (3D Secure)
```

## Webhook — idempotency (EN KRİTİK KURAL)
Sağlayıcılar aynı webhook'u **birden çok kez** gönderir. Kurallar:

1. **İmza doğrula** (HMAC/secret). Geçersiz → `401`, işleme alma.
2. `providerId` ile Order bul.
3. **Order zaten PAID ise → hemen `200 OK`, hiçbir şey yapma.** (Çift bilet üretimini bu önler.)
4. PENDING → PAID, `paidAt=now`, IssuedTicket'lar üret.
5. Tüm adım tek `$transaction` içinde (Order güncelle + IssuedTicket yarat).
6. Her zaman `200` döndür (sağlayıcı retry'ı durdursun) — gerçek hata varsa logla + alert.

```ts
// idempotency çekirdeği
if (order.status === OrderStatus.PAID) return { ok: true }; // no-op
await prisma.$transaction(async (tx) => {
  await tx.order.update({ where:{id}, data:{ status:'PAID', paidAt:new Date() }});
  await tx.issuedTicket.createMany({ data: ticketsFor(order) });
});
```

## Zaman aşımı (abandoned order)
- PENDING order'lar `salesCloseAt`/N dakika sonra cron ile `CANCELED` → **stok geri verilir** (`TicketTier.sold -= qty`).
- Önerilen TTL: 20 dk (3D Secure süresi + tampon).

## İade (refund)
```
1. ADMIN → POST /payments/:orderCode/refund
2. Order PAID mi? değilse → 409
3. provider.refund(providerId, amount)
4. Order → REFUNDED
5. IssuedTicket'lar invalidate (checkedIn olanlar için iade politikası uygulanır)
6. Stok geri verilir (etkinlik gelecekteyse)
7. AuditLog'a yaz
```
Etkinlik `CANCELED` olursa → tüm PAID order'lar toplu iade.

## Güvenlik notları
- Webhook ucu `@Public()` ama **imza zorunlu** — auth yerine imza.
- Tutarı asla istemciden alma; her zaman sunucuda `TicketTier.priceMinor × qty` ile yeniden hesapla.
- `IssuedTicket.code` tahmin edilemez olmalı (rastgele 128-bit veya imzalı JWT). cuid yeterince rastgele ama QR için imzalı token tercih edilir.
- Webhook ham gövdesini imza doğrulaması için **parse etmeden** sakla (raw body middleware).

## Test
- Iyzico sandbox + test kartları.
- Webhook'u iki kez gönderip **tek** bilet üretildiğini doğrula (idempotency testi).
- Eşzamanlı 2 satın alma ile son bileti yarıştır → overselling olmamalı.
