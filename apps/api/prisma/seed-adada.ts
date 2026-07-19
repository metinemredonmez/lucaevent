/**
 * "Luca Adada" gün-paketi etkinliğini oluşturur/günceller (idempotent, slug: "adada").
 * Rezervasyon config'i (paketler/meze/paddle/program) SADECE ilk oluşturmada yazılır;
 * sonradan admin panelinden düzenlenirse re-run EZMEZ. coverUrl boş bırakılır (menü
 * görseli admin'den yüklenir).
 * Çalıştır (prod): cd apps/api && pnpm seed:adada
 */
import { EventKind, EventStatus, PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

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
          console.log(`ℹ️  DATABASE_URL ${f} dosyasından yüklendi.`);
          return;
        }
      }
    }
  }
})();

const prisma = new PrismaClient();

const RESERVATION = {
  enabled: true,
  packages: [
    { id: 'plaj-aksam', name: 'Plaj kullanımı + akşam yemeği', alt: '1 duble rakı dahil', price: 1750 },
    { id: 'kahvalti', name: 'Açık büfe kahvaltı + sınırsız çay', alt: '09.00 – 11.00', price: 750 },
  ],
  mezePrice: 300,
  paddle: [
    { id: 'yok', name: 'Katılmıyorum', price: 0 },
    { id: 'tek', name: 'Tek kişi binerse', price: 750 },
    { id: 'cift', name: 'İki kişi binerse (kişi başı)', price: 500 },
  ],
  program: [
    { time: '09.00 – 11.00', desc: 'Kahvaltı saati' },
    { time: '12.00 – 17.00', desc: 'Paddle ve deniz' },
    { time: '17.00', desc: 'Akşam yemeği başlangıç' },
  ],
  note: 'Ekstra rakı, şarap, bira veya meşrubat isteyenler mekandan satın alarak temin edebilir.',
  menuImageUrl: null as string | null,
};

async function main() {
  console.log('🏖️  Luca Adada etkinliği hazırlanıyor…');

  const category = await prisma.category.upsert({
    where: { slug: 'outdoor-spor' },
    update: {},
    create: { slug: 'outdoor-spor', name: 'Outdoor & Spor', icon: 'mountain', color: '#3A7D5B', position: 1 },
  });

  const venue = await prisma.venue.upsert({
    where: { slug: 'luca-adada' },
    update: {},
    create: {
      slug: 'luca-adada',
      name: 'Luca Adada',
      address: 'Adalar, İstanbul',
      city: 'İstanbul',
      country: 'TR',
      lat: 40.8747,
      lng: 29.0546,
      capacity: 60,
    },
  });

  // startsAt: yakın gelecekte bir gün (etkinlik "yaklaşan" olarak görünsün)
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 10);
  startsAt.setHours(9, 0, 0, 0);
  const endsAt = new Date(startsAt);
  endsAt.setHours(22, 0, 0, 0);

  const existing = await prisma.event.findUnique({ where: { slug: 'adada' } });

  const event = await prisma.event.upsert({
    where: { slug: 'adada' },
    update: {
      title: 'Luca Adada',
      tagline: 'Plaj, paddle ve akşam yemeği — bir günlük ada kaçamağı',
      categoryId: category.id,
      venueId: venue.id,
      status: EventStatus.PUBLISHED,
      // reservation & coverUrl bilerek dokunulmuyor (admin düzenlemesi korunur)
    },
    create: {
      slug: 'adada',
      title: 'Luca Adada',
      tagline: 'Plaj, paddle ve akşam yemeği — bir günlük ada kaçamağı',
      description:
        'Gün boyu ada keyfi: sabah açık büfe kahvaltı, gündüz paddle ve deniz, akşam güneşe karşı yemek. ' +
        'Paketini seç, rezervasyonunu bırak — gerisini biz hallederiz.',
      kind: EventKind.PARTY,
      startsAt,
      endsAt,
      categoryId: category.id,
      venueId: venue.id,
      status: EventStatus.PUBLISHED,
      publishedAt: new Date(),
      reservation: RESERVATION as any,
    },
  });

  console.log(`✅  Etkinlik ${existing ? 'güncellendi' : 'oluşturuldu'}: /etkinlik/${event.slug}  (id: ${event.id})`);
  if (existing) console.log('ℹ️  Mevcut kayıt — reservation/coverUrl korundu (admin düzenlemesi ezilmedi).');
}

main()
  .catch((e) => {
    console.error('❌  Hata:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
