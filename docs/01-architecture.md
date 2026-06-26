# 01 — Mimari

## Genel bakış
pnpm + Turborepo monorepo. Tek backend API'yi üç istemci tüketir: admin paneli, web sitesi, mobil uygulama.

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Web (Next) │   │ Admin (Next)│   │ Mobile(Expo)│
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └────────────────►│◄────────────────┘
                  REST API (NestJS)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   PostgreSQL         Redis          Object Storage
   (Prisma)        (cache/queue)      (MinIO/S3)
                         │
              Iyzico / PayTR (ödeme)
```

## Repo yapısı
```
lucaevent/
├── apps/
│   ├── api/      NestJS + Prisma + Redis   (port 3001, Swagger /docs)
│   ├── web/      Next.js 15 + Tailwind + shadcn/ui  (port 3000)
│   ├── admin/    Next.js (eklenecek)        (port 3002)  — faz: Admin
│   └── mobile/   Expo + Expo Router (eklenecek)          — faz: Mobil
├── docs/
├── docker-compose.dev.yml   Postgres + Redis + Mailpit + MinIO
├── turbo.json
└── pnpm-workspace.yaml
```

> Not: `admin` ayrı app mı yoksa `web` içinde `/admin` route grubu mu olacak — bkz. [10-decisions.md](10-decisions.md) ADR-006. MVP'de ayrı `apps/admin` öneriliyor (yetki ve build izolasyonu).

## Stack kararları
| Katman | Seçim | Neden |
|---|---|---|
| Backend | NestJS + Prisma | Modüler, DI, Swagger, tip güvenli ORM. Emre'nin diğer projeleriyle tutarlı. |
| DB | PostgreSQL | İlişkisel, transaction (bilet stoğu için şart). |
| Cache/Queue | Redis | Rate limit, oturum, ödeme webhook job kuyruğu. |
| Storage | MinIO (dev) / S3 (prod) | Etkinlik görselleri, afiş, aftermovie. |
| Web | Next.js 15 + shadcn/ui | SSR/SEO + copy-paste component. |
| Mobil | Expo + Expo Router + NativeWind + React Native Reusables | Web shadcn ile aynı tasarım dili. |
| Ödeme | Iyzico / PayTR | Türkiye, taksit, 3D Secure. |
| Mail/SMS | Resend / Netgsm | Bilet gönderimi, doğrulama. |

## Veri akışı — bilet alma (özet)
1. Web/mobil → `POST /bookings` (PENDING order + stok rezerv)
2. API → ödeme sağlayıcı checkout URL döner
3. Kullanıcı öder → sağlayıcı **webhook** → `POST /payments/webhook`
4. API webhook'u doğrular (imza) → Order PAID → IssuedTicket + QR üretir
5. Mail/SMS ile bilet gönderilir
Detay: [03-logic-flows.md](03-logic-flows.md), [06-payments.md](06-payments.md).

## Ortam (env)
- `.env.dev` (gitignore'da), `.env.dev.example` şablon.
- Docker yalnız altyapı: Postgres + Redis + Mailpit + MinIO. Back/front **lokalde** çalışır (Docker'da değil).
- Lokal portlar: Web 3000, API 3001, Admin 3002, Swagger 3001/docs, Prisma Studio 5555, Mailpit 8025, MinIO 9001.

## Cross-cutting
- **Auth:** JWT access + refresh token (rotasyon, `RefreshToken` modeli). Bkz. [05-roles-permissions.md](05-roles-permissions.md).
- **Rate limit:** `ThrottlerModule` (60s/120 istek), global guard.
- **Logging:** `nestjs-pino`, authorization/cookie redaction.
- **Audit:** kritik admin işlemleri `AuditLog`'a yazılır.
- **Validation:** `class-validator` DTO'lar, global `ValidationPipe`.
