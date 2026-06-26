# 12 — Özellik Haritası (Feature Map)

Bu tarz event + lifestyle + booking platformunda olması gerekenlerin tam listesi, **Luca'nın durumuna göre** işaretli. Durum: ✅ var (Faz 1) · 🟡 altyapı/kısmi · ⬜ yok. Tek doğruluk kaynağı bu dosya; iş bitince işaret güncellenir.

## 1. Hesap & Kimlik
- ✅ Email/şifre · ✅ Google · ✅ rol sistemi
- ⬜ Apple Sign-In (mobilde App Store zorunlu) · ⬜ Telefon/OTP
- ✅ Email doğrulama · ✅ Şifre sıfırlama (token + mail; mail transport: nodemailer varsa SMTP, yoksa log)
- 🟡 2FA (alan var, akış yok) · 🟡 Onboarding/ilgi alanı (alan var, ekran yok)
- ✅ KVKK açık rıza (register'da onay zorunlu + saklanır: kvkk/terms timestamp, marketing, versiyon) · ✅ hesap silme (anonimleştirme) · ✅ public register/login/şifre-sıfırlama UI (şifre gücü, göster/gizle)

## 2. Keşfet & Arama
- ✅ Kategori/dikey filtre · ✅ upcoming/past
- ✅ Bugün/yarın/hafta sonu/ücretsiz hızlı filtreleri · ✅ Tam metin arama (q)
- ✅ Konum / "yakınımda" (lat/lng/radiusKm bounding-box) · ⬜ harita (frontend) · 🟡 İlgi alanına göre öneri
- ✅ Favori/kaydet (ekle/liste/sil)

## 3. Etkinlik & İçerik
- ✅ Detay (agenda/eğitmen/dahil olanlar) · ✅ bilet türleri · ✅ kontenjan/sold-out
- ✅ **Tekrarlayan etkinlik** (EventSeries → occurrence üretimi; haftalık/günlük + weekdays + interval; her seans kendi bileti)
- ✅ Bekleme listesi (dolu tier→waitlist; iptal/iade/abandoned yer açınca FIFO bildirim) · ✅ Kupon/promosyon (%/sabit, maxUses atomik, scope/min/tarih)
- 🟡 Galeri/video (Media modeli var, akış yok) · 🟡 Kamp oda tipi (basit)

## 4. Ödeme
- ✅ Bilet+stok (concurrency-safe) · ✅ iade akışı
- 🟡 Gerçek ödeme (mock var → Iyzico/PayTR) · ⬜ 3D Secure/taksit
- ⬜ Fatura/e-arşiv · ✅ Abandoned-order timeout (cron: 20dk → CANCELED + stok iade) · ⬜ Cüzdan/kredi/üyelik (Luca Plus)

## 5. Bilet & Giriş
- ✅ QR bilet · ✅ kapıda check-in (DOOR)
- ⬜ Takvime ekle (.ics) · ⬜ Apple/Google Wallet pass · ⬜ Bilet transfer/hediye · ⬜ Offline check-in

## 6. Sosyal & Topluluk
- 🟡 Topluluk (etiket+WhatsApp) · ⬜ Gerçek topluluk (üyelik/feed/duyuru)
- ✅ Etkinlik sonrası yorum & puan (yalnız PAID alıcı; avg/count)
- ⬜ "Kimler geliyor" · ⬜ Arkadaş davet/paylaş · ⬜ Takip · ⬜ Foto albümü

## 7. Bildirim & İletişim
- ✅ Push altyapısı (OneSignal)
- ✅ Otomatik tetikleyiciler (bilet onayı maili+push, ~24h hatırlatma) · ⬜ değişiklik/iptal bildirimi
- 🟡 Email gönderimi (SMTP env var, stub; Mailpit lokal hazır) · ⬜ SMS · ⬜ In-app bildirim merkezi · 🟡 Newsletter

## 8. Admin & Operasyon
- ✅ Etkinlik/bilet/kullanıcı CRUD · ✅ dashboard · ✅ CSV export · ✅ rol yönetimi · ✅ audit log (model)
- 🟡 Admin paneli UI (Faz 2 — `apps/web/app/admin`: login+layout+dashboard+etkinlikler+kategoriler+kuponlar+ayarlar+check-in ✅; etkinlik oluştur/düzenle formu + katılımcı/rezervasyon/waitlist ekranları ⬜) · ✅ **Ayarlar/Entegrasyonlar UI** (backend ✅ `/admin/settings` + SettingsService + şifreli secret; admin UI ⬜ — ADR-013) · ⬜ Landing CMS · ⬜ E-posta kampanya

## 9. Altyapı & Kalite
- ✅ Auth/rate-limit/validation · ✅ oversell/idempotency güvenli
- ✅ Görsel upload (S3/MinIO presigned PUT, bağımlısız SigV4) · 🟡 Redis (var, az kullanım) · 🟡 BullMQ (var → hatırlatma/email/cron)
- 🟡 Sentry/pino · ⬜ Analytics (PostHog) · ⬜ i18n (TR/EN) · 🟡 SEO · ⬜ Test (e2e/unit) · 🟡 CI/CD

## 10. Mobil (Faz 4 — Expo)
- ✅ Push backend · ⬜ Apple Sign-In (zorunlu) · ⬜ Deep link · ⬜ Wallet pass · ⬜ Store yayını

## 11. Yasal (TR zorunlu)
- 🟡 KVKK/çerez/kullanım koşulları/mesafeli satış+iptal-iade **taslakları Luca'ya özel yazıldı** (`/kvkk` `/cerez` `/kosullar` `/mesafeli-satis`) — **hukuk onayı + şirket bilgisi (ünvan/adres/MERSIS/vergi) doldurulmalı** · 🟡 Yaş doğrulama (ageMin var, kapıda kimlik)

---

## 🎯 Bize göre en kritik 8 (sıralı)
1. **Gerçek ödeme (Iyzico)** — bunsuz canlıya çıkamazsın
2. **Email doğrulama + şifre sıfırlama** — temel auth tamamlanmalı
3. **Tekrarlayan etkinlik** — haftalık yoga/pilates modelin belkemiği
4. **Bildirim tetikleyicileri + email** (bilet/hatırlatma)
5. **Admin paneli UI** (Faz 2)
6. **Yorum & puan + favori**
7. **Bekleme listesi + takvime ekle**
8. **Mesafeli satış/iade sözleşmesi + Apple Sign-In**

## Sıra (karar)
**Faz 1.5 başlangıç = Settings altyapısı** (DB `Setting` + `SettingsService`, ADR-013). Neden önce: kritik #1 ödeme dahil tüm entegrasyon anahtarları (Iyzico/OneSignal/SMTP) admin-managed Settings'ten beslenecek → keystone. Sonra sırasıyla: email altyapısı (Mailpit) + email doğrulama/şifre sıfırlama → tekrarlayan etkinlik → bildirim tetikleyicileri → abandoned-order cron → favori/yorum → Faz 2 admin UI.
