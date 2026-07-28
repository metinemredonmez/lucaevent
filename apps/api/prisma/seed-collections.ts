/**
 * İlk video koleksiyonunu ("Pazar collection'ları") oluşturur — idempotent.
 * Var olan koleksiyona dokunmaz, sadece eksik videoları ekler; admin panelinden
 * silinen video re-run ile geri gelmez (aynı videoId varsa atlanır, yoksa eklenir —
 * bu yüzden yeniden ekleme istemiyorsan koleksiyonu panelden yönet).
 * Çalıştır (prod): cd apps/api && pnpm seed:collections
 */
import { CollectionStatus, PrismaClient } from '@prisma/client';
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

// Koleksiyonlar — her biri farklı bir şerit tasarımı (layout) ile.
// LIFO: dizide SONRAKİ = daha yeni = ana sayfada daha ÜSTTE görünür.
// Boş (urls:[]) olanlar videosu eklenene dek sitede görünmez; admin'den doldurulur.
type Seed = { slug: string; title: string; subtitle: string; layout: string; urls: string[] };
const COLLECTIONS: Seed[] = [
  {
    slug: 'pazar-collectionlari',
    title: "Pazar collection'ları",
    subtitle: 'Pazar için seçilmiş setler — house, nu disco, açık hava',
    layout: 'cinema',
    urls: [
      'https://www.youtube.com/watch?v=4kphqkoQthQ',
      'https://www.youtube.com/watch?v=lLwyqwJbMvw',
      'https://www.youtube.com/watch?v=3Eoi765lSsA',
      'https://www.youtube.com/watch?v=Yf3UpljAe4I',
    ],
  },
  {
    slug: 'gunluk-collectionlari',
    title: "Günlük collection'ları",
    subtitle: 'Bugünün seçkisi — güne eşlik eden mixler',
    layout: 'featured',
    urls: [
      'https://www.youtube.com/watch?v=4skb09tixM0',
      'https://www.youtube.com/watch?v=vN4Vc9T8QQc',
      'https://www.youtube.com/watch?v=3NQPYsqSemY',
      'https://www.youtube.com/watch?v=1rnAROkbrUk',
      'https://www.youtube.com/watch?v=uVGEN8lU-oI',
    ],
  },
  {
    slug: 'turkce-collectionlari',
    title: "Türkçe collection'ları",
    subtitle: 'Türkçe seçkiler — pop, rap, alternatif',
    layout: 'poster',
    urls: [
      'https://www.youtube.com/watch?v=_GOZDXq7I-I',
      'https://www.youtube.com/watch?v=6ywcf07KQZA',
      'https://www.youtube.com/watch?v=weVh_KolH1E',
      'https://www.youtube.com/watch?v=qlib3dFzaZk',
      'https://www.youtube.com/watch?v=C2tQrIHSXho',
    ],
  },
  {
    slug: 'yabanci-pop',
    title: 'Yabancı pop',
    subtitle: 'Dünya listelerinden — en çok dinlenenler',
    layout: 'numbered',
    urls: [
      'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
      'https://www.youtube.com/watch?v=H5v3kku4y6Q',
      'https://www.youtube.com/watch?v=JGwWNGJdvx8',
      'https://www.youtube.com/watch?v=DyDfgMOUjCI',
      'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    ],
  },
];

/** oEmbed — anahtarsız; ulaşılamazsa başlık video id'ye düşer. */
async function meta(videoId: string) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const fallback = {
    url,
    videoId,
    title: videoId,
    author: null as string | null,
    thumbUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`,
    );
    if (!res.ok) return fallback;
    const d = (await res.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
    return {
      ...fallback,
      title: d.title?.trim() || fallback.title,
      author: d.author_name?.trim() || null,
      thumbUrl: d.thumbnail_url?.trim() || fallback.thumbUrl,
    };
  } catch {
    return fallback;
  }
}

async function main() {
  console.log('🎧  Koleksiyonlar hazırlanıyor…');

  for (const seed of COLLECTIONS) {
    // Koleksiyonu oluştur (varsa dokunma — layout/başlık admin'den yönetiliyor olabilir).
    const collection = await prisma.collection.upsert({
      where: { slug: seed.slug },
      update: {},
      create: {
        slug: seed.slug,
        title: seed.title,
        subtitle: seed.subtitle,
        status: CollectionStatus.PUBLISHED,
        layout: seed.layout,
        sort: 0,
      },
      include: { items: true },
    });

    const existing = new Set(collection.items.map((i) => i.videoId));
    let sort = collection.items.reduce((m, i) => Math.max(m, i.sort), -1) + 1;
    let added = 0;

    for (const raw of seed.urls) {
      const videoId = new URL(raw).searchParams.get('v')!;
      if (existing.has(videoId)) continue;
      const m = await meta(videoId);
      await prisma.collectionItem.create({
        data: { collectionId: collection.id, ...m, sort: sort++ },
      });
      added++;
      console.log(`   + [${seed.slug}] ${m.title}`);
    }

    const total = existing.size + added;
    console.log(
      `✅  ${seed.title} (${seed.layout}) — +${added} video, toplam ${total}` +
        (total === 0 ? ' (boş; admin\'den video eklenince görünür)' : ''),
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
