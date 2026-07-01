/**
 * Seed'in demo etkinliklerini PUBLIC'ten kaldırır (ARŞİVLER — SİLMEZ, geri alınabilir).
 * Sahte "CANLI" yayınını da kapatır. Gerçek 15 etkinliğe dokunmaz.
 * Çalıştır (prod): cd apps/api && pnpm clean:demo
 */
import { EventStatus, LiveStatus, PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// DATABASE_URL yoksa app ile aynı .env dosyalarından yükle (new PrismaClient()'tan önce).
(function loadDbUrl() {
  const valid = (v?: string) => !!v && /^postgres(ql)?:\/\//.test(v);
  if (valid(process.env.DATABASE_URL)) return;
  const dirs = [join(__dirname, '..'), join(__dirname, '..', '..'), process.cwd()];
  const files = ['.env.dev', '.env.prod', '.env'];
  for (const d of dirs) {
    for (const f of files) {
      const p = join(d, f);
      if (!existsSync(p)) continue;
      for (const raw of readFileSync(p, 'utf8').split('\n')) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq < 0) continue;
        const key = line.slice(0, eq).trim();
        let val = line.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (key === 'DATABASE_URL' && valid(val)) {
          process.env.DATABASE_URL = val;
          return;
        }
      }
    }
  }
  // son çare: env dosyada değil pm2'deyse — çalışan luca-api sürecinin ortamından oku
  if (!valid(process.env.DATABASE_URL)) {
    try {
      const cp = require('child_process');
      const pid = String(cp.execSync('pm2 pid luca-api', { encoding: 'utf8' })).split('\n')[0].trim();
      if (/^\d+$/.test(pid)) {
        for (const kv of readFileSync(`/proc/${pid}/environ`, 'utf8').split('\0')) {
          const eq = kv.indexOf('=');
          if (eq > 0 && kv.slice(0, eq) === 'DATABASE_URL' && valid(kv.slice(eq + 1))) {
            process.env.DATABASE_URL = kv.slice(eq + 1);
            break;
          }
        }
      }
    } catch {
      /* yoksay */
    }
  }
})();

const prisma = new PrismaClient();

// seed.ts'teki demo etkinlik slug'ları (gerçek import slug'larından farklı)
const DEMO_EVENT_SLUGS = [
  'sunset-yoga-sound-healing',
  'sabah-reformer-pilates',
  'belgrad-sabah-kosusu',
  'bogaz-gun-batimi-tekne',
  'seramik-atolyesi-kupa',
  'pazar-brunch-tanisma',
  'rooftop-sarap-peynir',
  'founders-breakfast',
  'luca-006-kadikoy',
  'luca-camp-2026',
  'luca-005-atolye',
];

async function main() {
  console.log('🧹  Demo etkinlikler public\'ten kaldırılıyor (arşivleniyor, silinmiyor)…');
  const r = await prisma.event.updateMany({
    where: { slug: { in: DEMO_EVENT_SLUGS } },
    data: {
      status: EventStatus.ARCHIVED,
      liveStatus: LiveStatus.OFFLINE,
      streamUrl: null,
    },
  });
  console.log(`✅  ${r.count} demo etkinlik arşivlendi. Gerçek 15 etkinlik ve admin girişi etkilenmedi.`);
  console.log('ℹ️  Geri almak istersen: aynı slug\'ları status=PUBLISHED yaparsın.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
