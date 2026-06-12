# @novara/api

Novara Network — NestJS API (backend).

## Özellikler

- NestJS 10 + TypeScript strict
- Prisma 6 + PostgreSQL
- JWT auth (access + refresh, Argon2 hash)
- Rol bazlı erişim (`SUPERADMIN`, `ADMIN`, `EDITOR`, `DOOR`, `VIEWER`)
- Zod ile env doğrulama (hatalı config ile açılmaz)
- Swagger UI (`/docs`)
- Throttler + Helmet + structured log (Pino)
- Health endpoint (DB check dahil)

## Yerel çalıştırma

Ön koşul: Postgres ve Redis Docker üzerinden ayakta (repo kökünde `pnpm db:up`).

```bash
# 1. env
cp ../../.env.dev.example ../../.env.dev  # kök dizinde

# 2. paketler
pnpm install

# 3. veritabanı
pnpm prisma:migrate        # şemayı uygula
pnpm db:seed               # örnek veri + test hesapları

# 4. çalıştır
pnpm dev                   # http://localhost:3001
                           # swagger:  http://localhost:3001/docs
```

## Modüller

| Modül | Sorumluluk |
|-------|------------|
| `auth` | Giriş, kayıt, refresh token, `/auth/me` |
| `users` | Admin tarafında kullanıcı listeleme, rol atama |
| `events` | Etkinlik CRUD (kamu + admin). `PARTY`, `CAMP`, `CONCERT`, `SHOWCASE` |
| `venues` | Mekân CRUD |
| `artists` | Sanatçı CRUD |
| `health` | Liveness + DB ping |
| `prisma` | Global Prisma client |
| `common` | Guard / decorator / filter (Roles, Public, CurrentUser, ExceptionFilter) |
| `config` | Zod env schema |

Sıradaki: `tickets`, `orders`, `media`, `subscribers`, `door`, `webhooks`, `queues`.

## Test hesapları (seed sonrası)

| E-posta | Şifre | Rol |
|---------|-------|-----|
| admin@novara.test | password123 | SUPERADMIN |
| editor@novara.test | password123 | EDITOR |
| door@novara.test | password123 | DOOR |
| viewer@novara.test | password123 | VIEWER |

## Örnek kullanım (curl)

```bash
# login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@novara.test","password":"password123"}'
# → { accessToken, refreshToken, expiresIn }

# public: yaklaşan etkinlikler
curl "http://localhost:3001/api/v1/events?range=upcoming"

# admin: etkinlik oluştur
curl -X POST http://localhost:3001/api/v1/admin/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"slug":"novara-007","title":"Novara 007","kind":"PARTY","startsAt":"2026-07-15T20:00:00Z"}'
```

## Yapı

```
apps/api/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── decorators/ (roles, public, current-user)
│   │   ├── guards/     (jwt-auth, roles)
│   │   └── filters/    (all-exceptions)
│   ├── config/env.schema.ts
│   ├── prisma/         (global module + service)
│   ├── health/
│   ├── auth/           (login, register, refresh, /me)
│   ├── users/
│   ├── events/         (public + admin)
│   ├── venues/
│   └── artists/
├── Dockerfile
├── nest-cli.json
├── package.json
└── tsconfig.json
```

## Yol haritası (sıradaki PR'lar)

- [ ] `tickets` + `orders` + `issued-tickets` modülleri
- [ ] Stripe + iyzico webhooks
- [ ] `media` — R2 signed upload + Mux asset
- [ ] `subscribers` — bülten çift-opt-in
- [ ] `door` — QR tarama endpoint'i
- [ ] `queues` — BullMQ işlemcileri (bilet e-postası, transcode)
- [ ] E2E test seti (supertest)
