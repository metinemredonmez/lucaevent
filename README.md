# Luca Club

Premium club deneyimi — Next.js web + NestJS API + Postgres + Redis.

```
luca/
├── apps/
│   ├── web/          Next.js 15 + Tailwind + shadcn/ui (port 3000)
│   └── api/          NestJS + Prisma + Redis (port 3001)
├── docker-compose.dev.yml    Postgres + Redis + Mailpit + MinIO
├── .env.dev                  Lokal env (gitignore'da)
├── .env.dev.example          Şablon
├── .env.prod.example         Production şablon
├── turbo.json
├── pnpm-workspace.yaml
└── package.json              Root scripts
```

## İlk kurulum (tek seferlik)

```bash
# 0. Ön koşul: Node 20+, pnpm 9+, Docker Desktop
node -v   # v20+
pnpm -v   # 9+
docker --version

# 1. Bağımlılıklar
pnpm install

# 2. Env dosyası (zaten oluşturulduysa atla)
cp .env.dev.example .env.dev   # değerleri kontrol et

# 3. Docker stack ayağa kalksın (postgres + redis + mailpit + minio)
pnpm db:up

# 4. Veritabanı şeması + seed
pnpm db:migrate
pnpm db:seed
```

## Günlük geliştirme

```bash
# Tek komut — backend + frontend paralel
pnpm dev

# Veya ayrı ayrı:
pnpm dev:api     # → http://localhost:3001 (Swagger: /docs)
pnpm dev:web     # → http://localhost:3000
```

## Lokal adresler

| Servis | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger UI | http://localhost:3001/docs |
| Prisma Studio | `pnpm db:studio` → http://localhost:5555 |
| Mailpit (yerel SMTP) | http://localhost:8025 |
| MinIO Console | http://localhost:9001 (luca / luca-dev-secret) |
| Postgres | `localhost:5432` (`luca/luca`) |
| Redis | `localhost:6379` |

## Docker komutları

```bash
pnpm db:up       # postgres+redis+mailpit+minio başlat
pnpm db:down     # durdur (veriyi koru)
pnpm db:reset    # SİL ve sıfırdan kur (DİKKAT)
pnpm db:logs     # canlı log
```

## Production deploy

```bash
# Sunucuda
cp .env.prod.example .env.prod
nano .env.prod                # değerleri doldur

pnpm install --frozen-lockfile
pnpm --filter @luca/api build
pnpm --filter @luca/web build

# pm2 ile çalıştır (ileride deploy/ klasörü eklenecek)
```

## Komut özeti

| Komut | Ne yapar |
|---|---|
| `pnpm dev` | Web + API paralel başlat |
| `pnpm dev:web` | Sadece Next.js (port 3000) |
| `pnpm dev:api` | Sadece NestJS (port 3001) |
| `pnpm build` | İkisini de build et |
| `pnpm typecheck` | TS kontrolü |
| `pnpm lint` | ESLint |
| `pnpm db:up/down/reset` | Docker stack |
| `pnpm db:migrate` | Prisma migration |
| `pnpm db:seed` | Test verisi yükle |
| `pnpm db:studio` | Prisma Studio (web UI) |
