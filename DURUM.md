# DURUM — Luca (oturum devri / handoff)

> Bu dosya bir sonraki Claude oturumu içindir. Repo yeniden klonlandıktan sonra **önce bunu oku**,
> sonra `AGENTS.md` + `docs/`'u oku. Amaç: nerede kaldığımızı ve nasıl deploy edildiğini hatırlamak.
> Son güncelleme: 2026-07-29. Son commit: `e048a6c`. Branch: `main` (origin ile eşit).

---

## PROMPT (bir sonraki oturuma yapıştırılabilir)

> Luca etkinlik + biletleme platformunda çalışıyorum (Next.js 15 web + NestJS API, pnpm monorepo).
> Repo: github.com/metinemredonmez/lucaevent. Yerel: `~/Desktop/luca`. Deploy: `ssh ts` →
> `/var/www/luca`, pm2 (`luca-web`, `luca-api`, `luca-wa`). Açıklama Türkçe, kod İngilizce.
> Değişiklik sonrası akış: `cd /var/www/luca && git pull origin main && pnpm install && pnpm build && pm2 restart all`.
> Şema değişen deploy'da build'den önce: `cd apps/api && export DATABASE_URL="$(grep -E '^DATABASE_URL=' /var/www/luca/.env.prod | head -1 | cut -d= -f2-)" && pnpm prisma migrate deploy`.
> Migration geçmişi baseline'landı, artık senkron. Admin: `admin@luca.test` / `password123` (prod'da değiştirilmeli).
> Bu oturumda ana sayfaya "Collection" (YouTube video koleksiyonları) sistemi + 3 yeni etkinlik eklendi,
> ana sayfa hero/etkinlik panosu elden geçirildi. Açık konular aşağıda "BEKLEYEN" başlığında.

---

## BU OTURUMDA YAPILANLAR

### 1) Collection sistemi (ana sayfa video koleksiyonları) — admin'den yönetilir
- **Modeller:** `Collection` (slug, title, subtitle, status DRAFT/PUBLISHED, `layout`, sort) + `CollectionItem`
  (url, videoId, title, author, thumbUrl, sort). Migration'lar: `20260726120000_add_collections`,
  `20260728120000_add_collection_layout`.
- **API:** public `GET /collections`; admin CRUD `@Roles(SUPERADMIN,ADMIN,EDITOR)`
  (`apps/api/src/collections/`). URL yapıştırınca **oEmbed** ile başlık/kanal/kapak otomatik dolar
  (`youtube.util.ts`). Aynı video iki kez eklenmez. `listPublished` boş koleksiyonu göstermez.
- **4 layout (şerit tasarımı):** `cinema` (geniş 16:9), `numbered` (top liste), `poster` (dikey duvar),
  `featured` (öne çıkan + ızgara). Komşu şeritler farklı görünsün diye dağıtıldı.
- **Sıra = LIFO:** `orderBy [{sort asc},{createdAt desc}]` → yeni koleksiyon en üstte. `sort` ile override.
- **Web:** `apps/web/components/sections/collections.tsx` — CityPulse'un altında.
  Kapağa tıkla → **genie/FLIP animasyonlu** modal oynatıcı (youtube-nocookie). Video bitince
  **otomatik sıradaki** (YouTube postMessage `onStateChange`), son videodan sonra başa döner.
  Video açılınca radyo susar (`luca:radio-pause`/`resume`), kapanınca devam.
- **Başlık sağı:** çerçeveli "LUCA RADYO" rozeti (equalizer + yazı). Koleksiyonların altında
  **tam genişlik sinematik radyo bandı** (aurora + akan dalga + dev equalizer + "Radyoyu aç" →
  `luca:radio-open` sayfadaki radyoyu başlatır).
- **Admin ekranları:** `/admin/collections` (liste + yeni + yayınla/taslak) ve `[id]` (bilgiler +
  layout seçimi + URL ekle/sil + ↑↓ sıra).
- **Görsel host:** `i.ytimg.com` / `img.youtube.com` `next.config.ts`'e eklendi.
- **Seed:** `apps/api/prisma/seed-collections.ts` → `pnpm seed:collections` (idempotent).
  Kurulu 7 koleksiyon: Pazar, Günlük, Türkçe, Yabancı pop, Deep House, Chill, New Age (her biri ~5 video,
  oEmbed ile doğrulandı). Kullanıcı ayrıca panelden video ekliyor.

### 2) Etkinlikler
- **Demo temizlendi:** `pnpm clean:demo` seed demolarını ARCHIVED yaptı (silmedi).
- **3 gerçek etkinlik** eklendi (`import-luca-events.ts` → `pnpm import:events`, idempotent):
  - Sahilde Şarap Buluşması · Maltepe — 31 Tem 19:00, `social`, venue maltepe-sahil
  - İstanbul'un Gizli Hazineleri — 1 Ağu 11:00, `gezi-seyahat`
  - Adalar'da Dalış Deneyimi — 2 Ağu 10:00, `outdoor-spor`, venue kucukyali-marina (agenda+included)
  - Yeni venue'lar: Küçükyalı Marina, Maltepe Sahili (haritalı).
- **Kapaklar:** Pexels stok görselleri `apps/web/public/img/events/` (sahilde-sarap-maltepe.jpg,
  istanbul-gizli-hazineleri.jpg, adalarda-dalis-deneyimi.jpg). `import:events` re-run'da `e.cover`
  doluysa coverUrl'ü YAZAR (admin'den yüklenen kapağı ezer — dikkat). Adalar'a kullanıcı kendi
  afişini admin'den yükleyecek.

### 3) Ana sayfa (CityPulse — "Şehrin Nabzı")
- **Etkinlik panosu zengin satır** oldu: kapak (yoksa kategori renkli placeholder) + kategori rozeti +
  gün damgası + başlık + tagline + saat/mekan + "Detay →". `apps/web/components/sections/city-pulse.tsx`
  `.cp-erow` / `BoardGroup`.
- **Açık tema hero düzeltmeleri (uzun deneme-yanılma, çözüldü):**
  - Foto `.cp.light .cp-bg{filter:saturate(1.08) brightness(0.95)}` — açık deniz sahnesi yıkanmıyor.
  - `.cp.light .cp-bg::after` gradient: foto %52-92 net, dip %92-99 KISA/keskin geçişle kağıda (bulanık pus yok).
  - Hero (slider) ↔ içerik ayrımı: içerik zemini foto'dan bir ton açık (dark `.cp{background:#0e1014}`,
    foto `#0a0b0d`). **box-shadow KULLANMA** — foto üst kenarına vurup radyo şeridiyle arasında ince koyu
    şerit yaratıyordu (bu yüzden kaldırıldı).

---

## DEPLOY (KRİTİK)

- **Sunucu:** `ssh ts` (Tailscale → `89.252.179.99`), kod `/var/www/luca`, süreçler **pm2**
  (`luca-web`, `luca-api`, `luca-wa`). Aynı sunucuda başka projeler de var (drivetune, yedioda,
  printly/pure vb.) — dikkatli ol, `pm2 restart all` hepsini yeniler.
- **API portu (internal):** `3019`. Public: `https://api.lucaclub.com.tr`. Site: `lucaclub.com.tr`.
- **Standart deploy (kod değişikliği):**
  ```bash
  cd /var/www/luca && git pull origin main && pnpm install && pnpm build && pm2 restart all
  ```
- **Şema değişen deploy:** build'den ÖNCE (Prisma CLI `.env.prod`'u otomatik okumaz):
  ```bash
  cd /var/www/luca/apps/api
  export DATABASE_URL="$(grep -E '^DATABASE_URL=' /var/www/luca/.env.prod | head -1 | cut -d= -f2-)"
  pnpm prisma migrate deploy
  ```
- **Migration baseline (BİR KEZ yapıldı, tekrar gerekmez):** Prod'da `_prisma_migrations` şemayla
  uyumsuzdu → `migrate deploy` P3005 verdi. Mevcut migration'lar `migrate resolve --applied <name>`
  ile baseline'landı (zaten kayıtlılar zararsız P3008 verir). Artık geçmiş TAM SENKRON; yeni
  migration'da sadece yukarıdaki `migrate deploy` yeter. Yeni tablo fiilen oluştu mu diye
  `psql "$DATABASE_URL" -c 'SELECT count(*) FROM "Tablo";'` ile doğrula.
- **Veri komutları (apps/api içinde, DATABASE_URL export'lu):** `pnpm seed:collections`,
  `pnpm import:events`, `pnpm clean:demo`, `pnpm seed:adada`.

---

## GİRİŞ / ORTAM
- **Admin:** `admin@luca.test` / `password123` (SUPERADMIN). `editor@luca.test` / `password123` (EDITOR).
  → `…/admin`. **Prod'da bu varsayılan şifre değiştirilmeli (güvenlik).**
- **Yerel dev:** Node 20 ZORUNLU. `cp .env.dev.example .env.dev && cp .env.dev apps/api/.env.dev`.
  `pnpm db:up` (docker: Postgres `localhost:55432`, Redis 6379, MinIO 9000). Migrate:
  `cd apps/api && DATABASE_URL="postgresql://luca:luca@localhost:55432/luca_dev" pnpm prisma migrate deploy`.
  `pnpm dev:api` (3001) + web `pnpm --filter @luca/web dev` (port meşgulse 3010/3011'e düşer).

---

## BEKLEYEN / AÇIK KONULAR
1. **Detay sayfası saat bug'ı (TIMEZONE):** Etkinlik detay sayfası saati UTC gösteriyor (örn. 19:00
   yerine "16:00 – 19:30"). Pano doğru (TRT). Detay sayfasında tarih formatlaması Europe/Istanbul'a
   çevrilmeli. Kullanıcı "saat düzelt" derse bak.
2. **"Fazla müzik sitesi gibi olsun":** Kullanıcı koleksiyon bölgesinin daha çok streaming/Spotify
   hissi vermesini istedi; yön netleşmedi (tümüyle koyu "müzik dünyası" mı, yoksa temayı takip edip
   daha çok oynatıcı dokunuşu mu). Karar bekliyor.
3. **Adalar Dalış kapağı:** Kullanıcı kendi WhatsApp afişini admin'den yükleyecek (şu an Pexels stok).
   Not: `import:events` re-run yüklenen kapağı EZER (cover alanı dolu).

---

## HAFIZA (kalıcı notlar)
Kullanıcının auto-memory'sinde bu proje için ayrıntılı notlar var (deploy akışı, CMS deseni, görsel
sourcing, radyo UI, agregatör vizyonu vb.). Yeni oturumda onlar da yüklenir. Bu dosya onların
oturum-sonu özeti + son durumdur.
