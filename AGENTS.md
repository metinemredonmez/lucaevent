# AGENTS.md — Luca

Bu dosyayı her oturum başında oku. Proje kuralları ve yön burada.

## Proje nedir
Luca = premium yaşam etkinlikleri (wellness/outdoor/workshop/kamp/sosyal/nightlife) için **etkinlik + biletleme platformu**. Gece kulübü değil; Luca'nın kendi küratörlü etkinliklerini satan kapalı platform. Detay: [docs/00-product.md](docs/00-product.md).

## Önce oku
İş yapmadan önce ilgili dokümanı oku:
- Ne yapıyoruz / kapsam → `docs/00-product.md`
- Mimari / stack → `docs/01-architecture.md`
- Veri modeli + schema delta → `docs/02-domain-model.md`
- **Çekirdek mantık (state machine'ler)** → `docs/03-logic-flows.md`
- API uçları → `docs/04-api-spec.md`
- Yetkiler → `docs/05-roles-permissions.md`
- Ödeme → `docs/06-payments.md`
- Tasarım → `docs/07-design-system.md`
- Kararlar (neden) → `docs/10-decisions.md`

## Build sırası
Backend → Admin → Web → Mobil. Bir faz çalışır+test edilebilir bitmeden sonrakine geçme. Bkz. `docs/09-roadmap.md`.

## Değişmez kurallar
1. **Para = minor unit (kuruş, Int).** Asla float. 750 TL = 75000.
2. **Bilet stoğu tek `$transaction`** içinde düşülür (overselling yasak).
3. **Ödeme webhook idempotent** + imza zorunlu + tutar sunucuda hesaplanır.
4. **En az yetki:** her admin ucu açık `@Roles(...)`; rol atama yalnız SUPERADMIN.
5. **Kapsam disiplini:** topluluk/marketplace/eşleşme/kredi MVP'de YOK (ADR-001).
6. Yeni kararı `docs/10-decisions.md`'ye ADR olarak ekle.

## Stack
- `apps/api` NestJS + Prisma + Postgres + Redis (3001, Swagger /docs)
- `apps/web` Next.js 15 + Tailwind + shadcn/ui (3000)
- `apps/admin` (eklenecek) Next.js (3002)
- `apps/mobile` (eklenecek) Expo + Expo Router + NativeWind + React Native Reusables
- Docker yalnız altyapı; back/front lokalde.

## Komutlar
`pnpm dev` (web+api) · `pnpm dev:api` · `pnpm dev:web` · `pnpm db:up/down/reset` · `pnpm db:migrate` · `pnpm db:seed` · `pnpm db:studio`

## Dev ortamı — DİKKAT (kurulum tuzakları)
- **Node 20 ZORUNLU.** Sistem default'u Node 16 olabilir → prisma DDL (migrate/db push) **sessizce asılır**. nvm ile: `nvm use 20` (kurulu: v20.20.2). pnpm yoksa node20 altında `corepack enable` (node20/bin'e pnpm shim koyar; aksi halde `pnpm` node16 shim'ine düşer).
- **DB portları:** Postgres `localhost:55432`, Redis `6379`, MinIO `9000/9001` (printy projesi 5433/6380'de — çakışmaz). `DATABASE_URL=postgresql://luca:luca@localhost:55432/luca_dev`.
- **`.env.dev` apps/api'de OLMALI.** ConfigModule env'i kendi cwd'sinden (`apps/api`) okur; kök `.env.dev` yetmez → `cp .env.dev apps/api/.env.dev`.
- **`prisma migrate dev` INTERAKTİF** (TTY ister); headless'ta yeni migration için: `prisma migrate diff --from-url $DATABASE_URL --to-schema-datamodel prisma/schema.prisma --script > migrations/<ts>_name/migration.sql` sonra `prisma migrate deploy`.
- Backend durumu: Faz 1 BİTTİ — bkz. [docs/09-roadmap.md](docs/09-roadmap.md), bilinen backlog [docs/11-security-backlog.md](docs/11-security-backlog.md).

## Stil
- Türkçe açıklama, kod İngilizce.
- Mevcut kod stiline uy (DTO + class-validator, modüler Nest, shadcn pattern).
- Görsel/PDF çıktılarını proje içine yaz, ~/Desktop'a değil.
