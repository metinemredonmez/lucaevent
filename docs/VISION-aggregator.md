# Luca — Vizyon: Etkinlik/Tur Agregatörü (Trivago modeli)

> Bu, ürünün **büyük yönü**. Şu anki site tek-organizasyon gösteriyor; hedef bunu aşmak.

## Öz fikir

Luca, **Trivago'nun otellerde yaptığını etkinlik/tur/aktivitede yapar**: kullanıcı
tek yerden **farklı kaynaklardan** gelen etkinlikleri **arar, filtreler ve karşılaştırır**.

- Sadece "Luca'nın kendi etkinlikleri" değil.
- İstanbul'da (ve genelde) **ne varsa**: turlar, atölyeler, konserler, gece, doğa,
  workshop… farklı organizatör/sağlayıcılardan toplanır.

## Kaynaklar (çok-kaynaklı ingest)

| Kaynak | Durum |
|---|---|
| Kendi org etkinlikleri (admin) | ✅ var |
| WhatsApp grupları → Claude parse → DRAFT | ✅ kuruldu (wa-listener) |
| Google Places (mekan/etkinlik verisi) | ✅ entegre |
| 3. parti tur/etkinlik siteleri (scrape/API) | ⏳ planlı |
| Instagram / etkinlik sayfaları | ⏳ planlı |

Her sonuç, **hangi kaynaktan** geldiğini gösteren bir rozet taşır.

## Ürün yüzeyi (Trivago-tarzı arama)

- **Arama-odaklı ana ekran**: büyük arama + akıllı filtreler (kategori, tarih,
  konum/mesafe, fiyat aralığı, kaynak/sağlayıcı, "açık şimdi").
- **Karşılaştırma kartları**: fiyat, konum, tarih, puan, kaynak yan yana.
- **"En iyi eşleşme / en yakın / en ucuz"** sıralama.
- Harita + liste birlikte (mevcut /mekanlar bunun tohumu).
- Kendi etkinlikler + toplananlar **aynı sonuç listesinde**; kullanıcı seçer.

## Neden ayırt edici

Tek bir organizasyonun takvimi değil, **şehrin tüm sosyal/etkinlik arzını**
tek çatı altında aranabilir kılmak. WhatsApp AI ingest + Google Places +
canlı yayın + topluluk bu platformun parçaları.

---
_İlgili: WhatsApp ingest, Google Places entegrasyonu, canlı harita/yayın vizyonu._
