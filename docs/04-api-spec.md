# 04 — API Spec

Base: `http://localhost:3001` · Swagger: `/docs` · Auth: Bearer JWT (aksi belirtilmedikçe).
`@Public()` işaretli uçlar token istemez. Tüm gövdeler `class-validator` DTO ile doğrulanır.

## Konvansiyonlar
- Liste yanıtı: `{ items, total, take, skip }`
- Para: `*Minor` (kuruş, Int)
- Tarih: ISO 8601
- Hata: `{ statusCode, message, error }` (Nest standardı)

## Auth — `/auth` (mevcut)
| Method | Path | Açıklama | Auth |
|---|---|---|---|
| POST | `/auth/register` | Kayıt — `kvkkConsent`+`termsAccepted` **zorunlu (true)**, `marketingOptIn?`; onay timestamp+versiyon saklanır | Public |
| POST | `/auth/login` | Giriş → access+refresh | Public |
| POST | `/auth/google` | Google ID-token doğrula → access+refresh (upsert) | Public |
| POST | `/auth/verify-email` | `{ token }` → email doğrula | Public |
| POST | `/auth/resend-verification` | `{ email }` → doğrulama maili tekrar (enumeration yok) | Public |
| POST | `/auth/forgot-password` | `{ email }` → reset maili (her zaman 200) | Public |
| POST | `/auth/reset-password` | `{ token, password }` → şifre sıfırla + oturumları iptal | Public |
| POST | `/auth/refresh` | Token yenile (rotasyon) | refresh token |
| POST | `/auth/logout` | Refresh token iptal | Bearer |
| GET | `/auth/me` | Mevcut kullanıcı | Bearer |

**Google Sign-In akışı:** client (web/mobil) Google ile giriş yapar → `idToken`'ı `POST /auth/google { idToken }`'a yollar → backend `GOOGLE_CLIENT_ID` (audience) ile doğrular (Google tokeninfo), kullanıcıyı email ile upsert eder (`googleId` saklanır), Luca JWT döner. `GOOGLE_CLIENT_ID` env yoksa `503`. Ölçek için local JWKS / google-auth-library'ye geçilebilir.

## Events — `/events` (mevcut) + admin
**Public**
| Method | Path | Açıklama |
|---|---|---|
| GET | `/events?kind=&categoryId=&range=&free=&q=&lat=&lng=&radiusKm=&take=&skip=` | Yayınlı liste + keşfet filtreleri |

**Keşfet filtreleri:** `range` = upcoming\|past\|today\|tomorrow\|weekend · `free=true` (ücretsiz tier) · `q=` tam metin (başlık/tagline/açıklama) · `lat&lng&radiusKm` konum (venue bounding-box). Hepsi kombinlenebilir.
| GET | `/events/:slug` | Detay (venue, lineup, tickets, media) |

**Admin** (`/admin/events`, rol: EDITOR+)
| GET | `/admin/events` | Tümü (status fark etmez) |
| GET | `/admin/events/:id` | Detay |
| POST | `/admin/events` | Oluştur (DRAFT) |
| PATCH | `/admin/events/:id` | Güncelle |
| POST | `/admin/events/:id/publish` | Yayınla |
| POST | `/admin/events/:id/unpublish` | Geri çek |
| DELETE | `/admin/events/:id` | Sil |

## Event Series — `/admin/event-series` (tekrarlayan, EDITOR+)
Haftalık/günlük şablon → her tarih için **gerçek Event occurrence** (kendi bileti/kontenjanı/check-in'i) üretir. Haftalık yoga/pilates için.
| GET | `/admin/event-series` | Seri listesi (+ occurrence sayısı) |
| GET | `/admin/event-series/:id` | Detay + occurrence'lar |
| POST | `/admin/event-series` | Seri oluştur (freq, interval, weekdays[], startTime, durationMin, tierTemplate[]) |
| POST | `/admin/event-series/:id/generate` | Occurrence üret (`{ until? }`; idempotent, slug-YYYY-MM-DD ile upsert, max 200) |
| DELETE | `/admin/event-series/:id` | Seriyi sil (occurrence'lar kalır, seriesId null olur) |

`EventCreateDto` (özet): `title, slug, kind, startsAt, endsAt?, doorsAt?, venueId?, categoryId?, tagline?, description?, coverUrl?, agenda?, included?, campingAllowed?, ...`

## Categories — `/categories` (YENİ)
| GET | `/categories` | Public liste (keşfet filtresi) |
| POST | `/admin/categories` | Oluştur (ADMIN) |
| PATCH | `/admin/categories/:id` | Güncelle |

## Bookings — `/bookings` (YENİ — kritik)
| POST | `/bookings` | Sipariş oluştur (PENDING + stok rezerv) → checkout URL. Body: `{ eventId, items:[{tierId,qty}], buyer:{fullName,email,phone}, idempotencyKey }` |
| GET | `/bookings/:code` | Sipariş durumu (sahibi veya admin) |
| GET | `/me/bookings` | Kullanıcının siparişleri |

Yanıt (201): `{ orderCode, status:"PENDING", totalMinor, checkoutUrl }`
Hatalar: `409 SOLD_OUT`, `409 SALES_CLOSED`, `404 EVENT_NOT_FOUND`.

## Payments — `/payments` (YENİ)
| POST | `/payments/webhook` | Sağlayıcı webhook (Public ama **imza doğrulamalı**, idempotent) |
| POST | `/payments/:orderCode/refund` | İade (ADMIN) |

Bkz. [06-payments.md](06-payments.md).

## Tickets / Check-in — `/tickets` (YENİ)
| GET | `/me/tickets` | Kullanıcının biletleri (QR) |
| POST | `/tickets/check-in` | QR doğrula + giriş işaretle. Rol: DOOR+. Body: `{ code }` |
| GET | `/admin/events/:id/attendees` | Katılımcı listesi + check-in durumu |
| GET | `/admin/events/:id/attendees.csv` | CSV export |

Check-in yanıtı: `{ status:"OK"|"ALREADY_USED"|"INVALID", holderName, checkedInAt }`

## Venues — `/venues` (mevcut)
| GET | `/venues` · `/venues/:slug` | Public |
| POST/PATCH/DELETE | `/admin/venues...` | ADMIN |

## Artists — `/artists` (mevcut)
| GET | `/artists` · `/artists/:slug` | Public |
| POST/PATCH/DELETE | `/admin/artists...` | EDITOR+ |

## Subscribers — `/subscribe` (newsletter)
| POST | `/subscribe` | Public (email) |

## Health
| GET | `/health` | Public, DB+Redis ping |

## Dashboard (admin)
| GET | `/admin/stats` | Toplam etkinlik/satış, doluluk, popüler etkinlik, iptal oranı |

## Notifications — `/admin/notifications` (OneSignal, ADMIN)
| GET | `/admin/notifications/status` | `{ configured }` — env anahtarları var mı |
| POST | `/admin/notifications/broadcast` | Toplu push. Body: `{ title, message, url?, segment? }` (segment default "Subscribed Users") |
| POST | `/admin/notifications/send` | Hedefli push. Body: `{ userIds[], title, message, url? }` (userIds = OneSignal external id = Luca user.id) |

OneSignal REST v1, anahtarlar **Settings'ten** okunur (aşağı). Yapılandırılmamışsa `{ skipped: true }` döner (uygulama düşmez). Hedefli gönderim için mobil client `OneSignal.login(user.id)` ile external id'yi set etmeli. `NotificationsService` export'lu — ileride booking-PAID / etkinlik-hatırlatma tetikleyicilerine bağlanabilir.

## Settings — `/admin/settings` (admin-managed config, ADR-013)
| GET | `/admin/settings` | Tüm ayarlar: `{ key, label, category, source(db\|env\|unset), configured, value(secret→maskeli) }[]` |
| PATCH | `/admin/settings` | Toplu güncelle. Body: `{ items: [{ key, value }] }` |

Entegrasyon anahtarları (Google client id, OneSignal app/key, Iyzico, SMTP) **manuel .env değil admin'den** yönetilir. Değer çözümü: **DB → env fallback → ''**. Secret'lar DB'de **AES-256-GCM şifreli** (`enc:v1:…`), API'de maskeli (`su••••ef`). Servisler (`auth/google`, `notifications`) `ConfigService` yerine `SettingsService.get(key)` okur. İstisna: bootstrap secret'ları (DATABASE_URL/REDIS_URL/JWT) env'de kalır. *Not: cache tek-instance için; çok-instance'ta pub/sub invalidation gerekir.*

## Jobs / Tetikleyiciler — `/admin/jobs` (ADMIN)
Otomatik (in-process `setInterval`, tek-instance) + manuel tetik:
| Tetikleyici | Ne zaman | Ne yapar |
|---|---|---|
| Ödeme onayı | webhook PAID (anında) | Onay maili (+ giriş yapan alıcıya push) |
| Abandoned-order | 5 dk'da bir | TTL'i (20 dk) geçen PENDING order → CANCELED + stok iade |
| Hatırlatma | 60 dk'da bir | ~24h kalan etkinliklerin PAID katılımcılarına mail/push (bir kez, `reminderSentAt`) |

| POST | `/admin/jobs/abandoned-sweep` | Manuel çalıştır `{ ttlMinutes? }` (test: 0 = tüm PENDING) → `{ scanned, canceled }` |
| POST | `/admin/jobs/reminders` | Manuel çalıştır → `{ events, notified }` |

*Çok-instance için BullMQ repeatable job'a taşınmalı (ioredis+bullmq mevcut).*

## Uploads — Görsel (presigned)
| POST | `/admin/uploads/presign` | `{ filename, contentType, folder? }` → `{ key, uploadUrl, publicUrl, expiresInSec }` | EDITOR+ |

Client (admin UI) `uploadUrl`'e doğrudan PUT eder (dosya API'den geçmez), `publicUrl`'i event.coverUrl/Media'ya yazar. S3/MinIO SigV4, bağımlısız (node crypto).

## Calendar & Newsletter
| GET | `/events/:slug/calendar.ics` | iCalendar (.ics) | Public |
| POST | `/subscribe` | `{ email, source? }` newsletter | Public |
| DELETE | `/auth/account` | KVKK: hesabı anonimleştir + oturumları iptal | Bearer |
| POST | `/admin/events/:id/cancel` | Etkinliği iptal et → PAID iade + stok + waitlist kapat + bildirim | ADMIN+ |

## Coupons — İndirim kodu
| POST | `/coupons/validate` | `{ code, eventId, subtotalMinor }` → indirim önizleme (kullanım tüketmez) | Public |
| GET/POST/PATCH/DELETE | `/admin/coupons(/:id)` | CRUD | ADMIN |

Booking'de `couponCode` ile uygulanır: indirim sunucuda hesaplanır, `usedCount` maxUses altında atomik artırılır (yarış-güvenli). PERCENT (0-100) / FIXED (kuruş); scope (eventId), minSubtotal, tarih penceresi.

## Waitlist — Bekleme listesi
| POST | `/events/:slug/waitlist` | `{ tierId, email, fullName?, phone? }` — tier DOLU ise listeye gir (değilse 409 NOT_SOLD_OUT) | Public |
| GET | `/me/waitlist` | Kullanıcının bekleme kayıtları | Bearer |
| DELETE | `/me/waitlist/:id` | Listeden çık | Bearer |
| GET | `/admin/events/:id/waitlist` | Etkinliğin bekleme listesi | EDITOR+ |

Yer açılınca (refund/FAILED/abandoned-order → stok iade) FIFO ilk WAITING'e mail+push → NOTIFIED.

## Social — Favori & Yorum
| GET | `/me/favorites` | Kullanıcının favorileri (event detaylı) | Bearer |
| POST | `/me/favorites` | `{ eventId }` favoriye ekle | Bearer |
| DELETE | `/me/favorites/:eventId` | Favoriden çıkar | Bearer |
| GET | `/events/:slug/reviews` | `{ items, count, avg }` | Public |
| POST | `/events/:slug/reviews` | `{ rating(1-5), comment? }` — yalnız PAID alıcı; kullanıcı/etkinlik başına bir (upsert) | Bearer |
