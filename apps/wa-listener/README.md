# @luca/wa-listener

WhatsApp grubundaki etkinlik mesajlarını Luca API'ye ileten dinleyici (Baileys).
Bir telefonu "bağlı cihaz" olarak eşler, hedef grubun mesajlarını
`POST /webhooks/whatsapp/inbound`'a yollar. Parse + admin onayı API tarafında.

> ⚠️ Resmî olmayan istemci — WhatsApp ToS'a aykırıdır, numara ban riski taşır.
> Ayrı/burner bir numarayla kullan. Admin onayı (DRAFT) döngüde olduğu için
> hatalı veri siteye düşmez.

## Env (`/var/www/luca/.env.prod` ile aynı dosyadan okunur)

```
WA_API_URL=http://localhost:3001/api/v1      # API kök URL
WA_WEBHOOK_SECRET=<API ile aynı secret>
WA_GROUP_NAME=<dinlenecek grubun tam adı>     # boşsa: sadece grup adlarını loglar
WA_SESSION_DIR=/var/www/luca/apps/wa-listener/session
# WA_ALLOW_ALL=1                               # tüm gruplardan iletmek istersen
# WA_PAIR_NUMBER=905321234567                  # uzaktaki telefon: QR yerine eşleştirme kodu
```

## Uzaktaki telefon — eşleştirme kodu (QR yerine)

Telefon sende değil, arkadaşındaysa: `WA_PAIR_NUMBER`'a o numarayı ver
(uluslararası, sembolsüz — `905321234567`). Listener QR yerine **8 haneli kod**
basar. Kodu arkadaşına ilet; o telefonunda *WhatsApp → Bağlı Cihazlar →
Cihaz Ekle → "Telefon numarasıyla bağla"* deyip kodu girer.

## Kurulum (sunucuda, tek seferlik)

```bash
cd /var/www/luca
pnpm install                                   # baileys'i kurar

# 1) İlk çalıştır — QR üretir. WA_GROUP_NAME'i henüz bilmiyorsan boş bırak:
WA_API_URL=http://localhost:3001/api/v1 \
WA_WEBHOOK_SECRET=<secret> \
node apps/wa-listener/index.mjs
```

Terminaldeki **QR'ı** o telefonun WhatsApp'ından *Ayarlar → Bağlı Cihazlar →
Cihaz Ekle* ile okut. Bağlanınca gruba bir mesaj düşünce logda grup adını
görürsün → `WA_GROUP_NAME`'e yaz.

## pm2 ile kalıcı çalıştırma

```bash
pm2 start apps/wa-listener/index.mjs --name luca-wa \
  --cwd /var/www/luca \
  --env-from /var/www/luca/.env.prod
pm2 save
```

> Not: `--env-from` yoksa env değişkenlerini `pm2 start` öncesi `export` et ya da
> bir `ecosystem.config.cjs` kullan. `pnpm build` bu servisi derlemez (saf JS).

## Sınırlar (v1)

- Sadece **metin** (ve resim/video **caption**'ı) iletir. Salt görsel mesajlar
  atlanır — kapağı admin panelden eklersin.
- Tek hedef grup (`WA_GROUP_NAME`). Çoklu grup gerekirse `WA_ALLOW_ALL=1`.
