# Luca — Mobil (PWA + Native)

## 1) PWA (yapıldı ✅)
Web artık **yüklenebilir uygulama**:
- `apps/web/app/manifest.ts` → `/manifest.webmanifest` (ad, ikon, standalone, tema).
- `apps/web/public/sw.js` → service worker (network-first, çevrimdışı kabuk).
- `components/pwa-register.tsx` → SW kaydı (layout'ta mount).
- iOS meta (`appleWebApp`) → ana ekrana ekleyince tam ekran.

**Kullanıcı deneyimi:** Chrome/Android'de "Uygulamayı yükle", iOS Safari'de
"Ana Ekrana Ekle" → ikonuyla, adres çubuğusuz açılır. Push zaten OneSignal ile var.

> Daha iyi ikon için ileride `public/icon-192.png` + `public/icon-512.png`
> (maskable, kenar boşluklu) ekleyip manifest'e koyabiliriz.

## 2) Native app (App Store / Play Store) — Capacitor ile
En hızlı yol: **web'i sıfırdan yazmadan** Capacitor ile native kabuğa sar.
Native kabuk canlı PWA'yı (https://lucaclub.com.tr) yükler; push/derin-link
gibi native yetenekler eklenir. Bunlar **Xcode / Android Studio** gerektirir
(sunucuda değil, geliştirici Mac/PC'de yapılır):

```bash
# apps/web içinde (ya da ayrı bir mobile paketi)
pnpm add -D @capacitor/cli
pnpm add @capacitor/core @capacitor/ios @capacitor/android

npx cap init "Luca" "tr.lucaclub.app"   # appId: tr.lucaclub.app
```

`capacitor.config.ts`:
```ts
import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'tr.lucaclub.app',
  appName: 'Luca',
  webDir: 'public',                     // statik kabuk (server.url kullanınca önemsiz)
  server: { url: 'https://lucaclub.com.tr', cleartext: false }, // canlı PWA'yı yükler
  backgroundColor: '#0A0512',
};
export default config;
```

```bash
npx cap add ios
npx cap add android
npx cap sync
npx cap open ios       # Xcode → Signing (Apple Developer hesabı) → Archive → App Store Connect
npx cap open android   # Android Studio → Build → AAB → Play Console
```

**Push (native):** OneSignal Capacitor SDK (`onesignal-cordova-plugin` /
`@onesignal/onesignal-capacitor`) ekle; App ID zaten Ayarlar'da. Web push
yerine native push kanalı açılır.

**Mağaza gereksinimleri:** Apple Developer ($99/yıl) + Google Play ($25 tek sefer),
gizlilik/KVKK metni (var), uygulama ikonu + ekran görüntüleri, 18+ derecelendirme
(Actigo gibi).

> Not: `server.url` canlı siteyi yükler → her web deploy anında mobilde de güncel.
> Tamamen offline/bundled istenirse `next export` (statik) gerekir; SSR
> sayfaları (canlı yayın, ödeme callback) bunu zorlaştırır — remote URL önerilir.
