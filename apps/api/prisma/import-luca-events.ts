/**
 * @luca.club.tr Instagram etkinliklerini birebir içeri aktarır (idempotent, slug'a göre upsert).
 * Çalıştır (prod): cd apps/api && pnpm import:events
 * Demo etkinlikleri SİLMEZ; sadece bu gerçek etkinlikleri ekler/günceller.
 * Kaynak: kullanıcının attığı IG ekran görüntüleri (kazıma yok). Tatil/anma paylaşımları
 * ve tarihsiz "anı" reel'leri dahil edilmedi. Tarihler 2026, saat dilimi +03:00 (İstanbul).
 * Kapak (coverUrl) bilerek boş: admin → etkinlik → "Görsel yükle" ile gerçek IG afişi eklenir;
 * re-run yüklenen kapağı EZMEZ.
 */
import { EventKind, EventStatus, PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// DATABASE_URL yoksa/geçersizse, app ile AYNI .env dosyalarından yükle (prod'da env pm2
// başlangıç ortamında değil, dosyada; PrismaClient env'i instantiate anında okuduğu için
// bu blok new PrismaClient()'tan ÖNCE çalışmalı).
(function loadDbUrl() {
  const valid = (v?: string) => !!v && /^postgres(ql)?:\/\//.test(v);
  if (valid(process.env.DATABASE_URL)) return;
  // apps/api + repo kökü (env dosyası kökte: /var/www/luca/.env.prod) + çalışma dizini
  const dirs = [join(__dirname, '..'), join(__dirname, '..', '..'), process.cwd()];
  const files = ['.env.dev', '.env.prod', '.env']; // app ile aynı sıra (ilk geçerli kazanır)
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

async function main() {
  console.log('🎫  Luca gerçek etkinlikleri içeri aktarılıyor…');
  const now = new Date();

  // --- kategoriler (yoksa oluştur) ---
  const catData = [
    { slug: 'workshop', name: 'Workshop', icon: 'palette', color: '#B5852A', position: 3 },
    { slug: 'wellness', name: 'Wellness', icon: 'lotus', color: '#657257', position: 0 },
    { slug: 'nightlife', name: 'Nightlife', icon: 'disc', color: '#171717', position: 7 },
    { slug: 'outdoor-spor', name: 'Outdoor & Spor', icon: 'mountain', color: '#3A7D5B', position: 1 },
    { slug: 'gezi-seyahat', name: 'Gezi & Seyahat', icon: 'compass', color: '#C86B42', position: 2 },
    { slug: 'social', name: 'Social', icon: 'users', color: '#9C6B8E', position: 4 },
    { slug: 'food-drink', name: 'Food & Drink', icon: 'wine', color: '#A23E48', position: 5 },
  ];
  const cat: Record<string, { id: string }> = {};
  for (const c of catData) {
    cat[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
  }

  // --- mekânlar (harita için koordinatlı) ---
  const venueData = [
    { slug: 'sishane-beyoglu', name: 'Şişhane · Teras (Beyoğlu)', address: 'Şişhane, Beyoğlu, İstanbul', city: 'İstanbul', lat: 41.0293, lng: 28.9738, capacity: 30 },
    { slug: 'burgazada', name: 'Burgazada', address: 'Burgazada, Adalar, İstanbul', city: 'İstanbul', lat: 40.8797, lng: 29.0686, capacity: 40 },
    { slug: 'bogaz-tekne', name: 'Boğaz · Tekne', address: 'İstanbul Boğazı (tekne)', city: 'İstanbul', lat: 41.045, lng: 29.035, capacity: 120 },
    { slug: 'sile-kamp', name: 'Şile · Kamp Alanı', address: 'Şile, İstanbul', city: 'İstanbul', lat: 41.1756, lng: 29.6103, capacity: 120 },
    { slug: 'adalar-kalpazankaya', name: 'Adalar · Kalpazankaya', address: 'Kalpazankaya, Burgazada, Adalar', city: 'İstanbul', lat: 40.8747, lng: 29.0546, capacity: 40 },
    { slug: 'gulmahal-arnavutkoy', name: 'Gülmahal Sosyal Tesisleri · Arnavutköy', address: 'Arnavutköy, Sarıyer, İstanbul', city: 'İstanbul', lat: 41.0669, lng: 29.043, capacity: 80 },
    { slug: 'kadikoy-merkez', name: 'Kadıköy', address: 'Kadıköy, İstanbul', city: 'İstanbul', lat: 40.9903, lng: 29.027, capacity: 40 },
    { slug: 'ataturk-kent-ormani', name: 'Atatürk Kent Ormanı', address: 'Sarıyer, İstanbul', city: 'İstanbul', lat: 41.1085, lng: 29.013, capacity: 60 },
    { slug: 'gayrettepe-mecidiyekoy', name: 'Gayrettepe · Mecidiyeköy', address: 'Şişli, İstanbul', city: 'İstanbul', lat: 41.0673, lng: 28.9922, capacity: 40 },
    { slug: 'mardin', name: 'Mardin · Midyat', address: 'Mardin (uçaklı tur)', city: 'Mardin', lat: 37.3124, lng: 40.735, capacity: 40 },
    { slug: 'macka-demokrasi-parki', name: 'Maçka Demokrasi Parkı', address: 'Maçka, Şişli, İstanbul', city: 'İstanbul', lat: 41.0446, lng: 28.9946, capacity: 200 },
    { slug: 'belgrad-ormani', name: 'Belgrad Ormanı', address: 'Belgrad Ormanı, Sarıyer, İstanbul', city: 'İstanbul', lat: 41.1855, lng: 28.9836, capacity: 100 },
  ];
  const ven: Record<string, { id: string }> = {};
  for (const v of venueData) {
    ven[v.slug] = await prisma.venue.upsert({
      where: { slug: v.slug },
      update: {},
      create: { ...v, country: 'TR' },
    });
  }

  type Ev = {
    slug: string;
    title: string;
    tagline?: string;
    description?: string;
    kind: EventKind;
    categorySlug: string;
    venueSlug?: string;
    startsAt: string;
    endsAt: string;
    status: EventStatus;
    campingAllowed?: boolean;
    agenda?: { time: string; title: string }[];
    included?: string[];
    bringList?: string[];
    cover?: string; // varsa coverUrl olarak yazılır (repo'daki /img/events/<slug>.jpg)
  };

  const events: Ev[] = [
    // ——— Yaklaşan ———
    {
      slug: 'sile-kampi',
      title: "Şile'de Kamptayız!",
      cover: '/img/events/sile-kampi.jpg',
      tagline: 'Denize sıfır kamp — 3-5 Temmuz.',
      description:
        "3-5 Temmuz'da Şile'de, denize sıfır kamp alanında buluşuyoruz. At biniciliği, ATV safari, " +
        'mangal, pilates, zumba, voleybol ve çeşitli oyunlar. Farklı konaklama seçenekleri: bungalov, ' +
        'tiny house, loft house. Kamp alanı denize sıfır olduğu için bol bol yüzeceğiz.',
      kind: EventKind.CAMP,
      categorySlug: 'outdoor-spor',
      venueSlug: 'sile-kamp',
      startsAt: '2026-07-03T11:00:00+03:00',
      endsAt: '2026-07-05T16:00:00+03:00',
      status: EventStatus.PUBLISHED,
      campingAllowed: true,
      included: ['At biniciliği', 'ATV safari', 'Mangal', 'Pilates & Zumba', 'Voleybol & çeşitli oyunlar'],
    },
    {
      slug: 'parfum-workshopu',
      title: 'Parfüm Workshopu',
      cover: '/img/events/parfum-workshopu.jpg',
      tagline: 'Kendi kokunu keşfet — terasta deniz manzarasına karşı.',
      description:
        "İstanbul'da keyifli bir akşamda, terasta deniz manzarasına karşı parfüm dünyasına adım atıyoruz. " +
        "Toplam 60 farklı koku arasından kendi zevkine ve karakterine en uygun notaları seçecek, 2 farklı parfümü " +
        "10 ml'lik şişelerde kendin hazırlayacaksın. Kişilik testiyle sana en uygun kokuyu keşfedecek, kokunun " +
        'karakterinle nasıl bütünleştiğini deneyimleyeceksin. Hazırladığın parfümler etkinlik sonunda senin olacak.',
      kind: EventKind.TRIP,
      categorySlug: 'workshop',
      venueSlug: 'sishane-beyoglu',
      startsAt: '2026-07-10T20:00:00+03:00',
      endsAt: '2026-07-10T23:00:00+03:00',
      status: EventStatus.PUBLISHED,
      included: ['60 farklı koku arasından seçim', '2 adet 10 ml parfüm (senin olacak)', 'Kişilik testi & koku eşleştirme'],
    },
    {
      slug: 'yaza-merhaba-burgazada',
      title: 'Yaza Merhaba · Burgazada',
      cover: '/img/events/yaza-merhaba-burgazada.jpg',
      tagline: 'Canlan, dengelen, temas et — bir günü kendine ayır.',
      description:
        'Birlikte yaza merhaba diyoruz! Bir günü kendine ayır; hareket et, sosyalleş, denizin ve adanın tadını çıkar. ' +
        "Burgazada'da yoga, kahvaltı, deniz keyfi ve happy hour ile buluşuyoruz. Her seviyeye uygundur.",
      kind: EventKind.TRIP,
      categorySlug: 'wellness',
      venueSlug: 'burgazada',
      startsAt: '2026-07-12T10:00:00+03:00',
      endsAt: '2026-07-12T18:00:00+03:00',
      status: EventStatus.PUBLISHED,
      agenda: [
        { time: '10:00', title: 'Yoga Etkinliği' },
        { time: '11:00', title: 'Kahvaltı' },
        { time: '13:00', title: 'Deniz Keyfi' },
        { time: '17:00', title: 'Happy Hour' },
      ],
      bringList: ['Yoga matı', 'Rahat kıyafetler', 'Deniz için gerekli eşyalar', 'Bolca keyif ve merak'],
    },

    // ——— Geçmiş (2026) ———
    {
      slug: '21-haziran-tekne-partisi',
      title: '21 Haziran · En Uzun Gün Tekne Partisi',
      tagline: "İstanbul Boğazı'nda DJ performansları eşliğinde dans.",
      description:
        "21 Haziran, yılın en uzun gününde İstanbul Boğazı'nda birbirinden güzel DJ performansları eşliğinde " +
        'dans ile karşıladık. Birlikte daha nice etkinliklere!',
      kind: EventKind.PARTY,
      categorySlug: 'nightlife',
      venueSlug: 'bogaz-tekne',
      startsAt: '2026-06-21T14:00:00+03:00',
      endsAt: '2026-06-21T20:00:00+03:00',
      status: EventStatus.PUBLISHED,
    },
    {
      slug: 'luca-yogapi-senlikleri-1',
      title: 'Luca & Yogapi Şenlikleri I',
      tagline: 'Maçka Demokrasi Parkı — katılım ücretsiz.',
      description:
        "Maçka Demokrasi Parkı'nda Luca & Yogapi Şenlikleri I. Katılım ücretsizdi. Açılış ve içecekler, psikoloji " +
        'söyleşisi, yogapi, bachata-zumba-dans atölyesi, oyunlar, çuval yarışı ve özel tavernı ile kapanış.',
      kind: EventKind.TRIP,
      categorySlug: 'social',
      venueSlug: 'macka-demokrasi-parki',
      startsAt: '2026-06-14T15:00:00+03:00',
      endsAt: '2026-06-14T21:00:00+03:00',
      status: EventStatus.PUBLISHED,
      agenda: [
        { time: '15:00', title: 'Açılış & içecekler' },
        { time: '16:00', title: 'Psikoloji söyleşisi' },
        { time: '17:00', title: 'Yogapi' },
        { time: '18:00', title: 'Bachata · Zumba · Dans atölyesi' },
        { time: '19:00', title: 'Balance board & çeşitli oyunlar' },
        { time: '20:00', title: 'Çuval yarışı' },
        { time: '21:00', title: 'Özel tavernı & kapanış' },
      ],
    },
    {
      slug: 'luca-tanisma-kampi',
      title: 'Luca Kampta · Tanışma Kampı',
      tagline: 'Yazı karşıladığımız tanışma kampı — 5-7 Haziran.',
      description:
        'Yazı karşıladığımız bu tanışma kampına buluştuk. Çadır, karavan, küçük bungalov, tiny house ve loft house ' +
        'konaklama seçenekleriyle doğada üç gün.',
      kind: EventKind.CAMP,
      categorySlug: 'outdoor-spor',
      startsAt: '2026-06-05T11:00:00+03:00',
      endsAt: '2026-06-07T16:00:00+03:00',
      status: EventStatus.PUBLISHED,
      campingAllowed: true,
    },
    {
      slug: 'luca-belgrad-gunu',
      title: 'Luca Belgrad Günü',
      tagline: 'Belgrad Ormanı — sabah kahvaltısı, yürüyüş, mangal.',
      description:
        "Belgrad Ormanı'nda dolu dolu bir gün: sabah kahvaltısı, ormanda yürüyüş, kahve ve sohbet, çeşitli oyunlar " +
        've eğlence, mangal.',
      kind: EventKind.TRIP,
      categorySlug: 'outdoor-spor',
      venueSlug: 'belgrad-ormani',
      startsAt: '2026-06-06T09:00:00+03:00',
      endsAt: '2026-06-06T17:00:00+03:00',
      status: EventStatus.PUBLISHED,
    },
    {
      slug: 'psikoloji-sohbetleri',
      title: 'Psikoloji Sohbetleri',
      tagline: 'Uzman eşliğinde paylaşım ve farkındalık.',
      description: 'Keyifli bir ortamda uzman eşliğinde psikoloji sohbetleri; paylaşım, farkındalık ve güzel bir akşam.',
      kind: EventKind.TRIP,
      categorySlug: 'social',
      startsAt: '2026-06-04T19:00:00+03:00',
      endsAt: '2026-06-04T21:30:00+03:00',
      status: EventStatus.PUBLISHED,
    },
    {
      slug: 'adalarda-dalis',
      title: "Adalar'da Dalış Deneyimi",
      tagline: 'Tekne, dalış ve yüzme keyfi — her şey dahil.',
      description:
        "24 Mayıs'ta tekneyle Adalar'da dalış ve yüzme keyfi. 30 dakikalık dalış, tüm ekipmanlar, ücretsiz su altı " +
        'fotoğraf & video, öğle yemeği ve serbest yüzme dahil. Her şey dahil 4.000 TL. Kalkış 10:30, dönüş ~17:00.',
      kind: EventKind.TRIP,
      categorySlug: 'gezi-seyahat',
      venueSlug: 'adalar-kalpazankaya',
      startsAt: '2026-05-24T10:30:00+03:00',
      endsAt: '2026-05-24T17:00:00+03:00',
      status: EventStatus.PUBLISHED,
      included: ['30 dakikalık dalış', 'Tüm ekipmanlar', 'Su altı fotoğraf & video', 'Öğle yemeği', 'Serbest yüzme'],
    },
    {
      slug: 'luca-white-party',
      title: 'Luca White Party',
      tagline: "İstanbul Boğazı'nda tekne üstü white party.",
      description:
        "İstanbul Boğazı'nda tekne üstü White Party. Canlı DJ performansları, müzik ve manzara. Karaköy'den kalkış, " +
        '18:00-23:00. Kontenjan sınırlı. Katılım ücreti ~1.300₺.',
      kind: EventKind.PARTY,
      categorySlug: 'nightlife',
      venueSlug: 'bogaz-tekne',
      startsAt: '2026-05-16T18:00:00+03:00',
      endsAt: '2026-05-16T23:00:00+03:00',
      status: EventStatus.PUBLISHED,
    },
    {
      slug: 'yaza-merhaba-arnavutkoy',
      title: 'Yaza Merhaba Etkinliği · Arnavutköy',
      tagline: 'Serpme kahvaltı, at binme ve ATV safari.',
      description:
        'Gülmahal Sosyal Tesisleri (Arnavutköy) — yaza merhaba! Serpme kahvaltı, at binme ve ATV safarisi eşliğinde ' +
        'keyifli bir gün. Saat 10:00.',
      kind: EventKind.TRIP,
      categorySlug: 'outdoor-spor',
      venueSlug: 'gulmahal-arnavutkoy',
      startsAt: '2026-05-09T10:00:00+03:00',
      endsAt: '2026-05-09T16:00:00+03:00',
      status: EventStatus.PUBLISHED,
      included: ['Serpme kahvaltı', 'At binme', 'ATV safarisi'],
    },
    {
      slug: 'mardin-midyat-turu',
      title: 'Mardin · Midyat Turu',
      tagline: "Mezopotamya'nın kalbine 3 gece 3 gün uçaklı tur.",
      description:
        "Mezopotamya'nın kalbine yolculuk: 3 gece 3 gün uçaklı Mardin-Midyat turu. Mardin otellerinde konaklama, " +
        'uçak + bölge içi lüks araçlarla ulaşım. 22.500₺ peşin / 25.000₺ taksit. (24-27 Nisan ve 15-18 Mayıs tarihleri.)',
      kind: EventKind.TRIP,
      categorySlug: 'gezi-seyahat',
      venueSlug: 'mardin',
      startsAt: '2026-04-24T08:00:00+03:00',
      endsAt: '2026-04-27T20:00:00+03:00',
      status: EventStatus.PUBLISHED,
    },
    {
      slug: 'italyan-mutfagi-lezzetleri',
      title: 'İtalyan Mutfağı Lezzetleri',
      tagline: 'Gayrettepe-Mecidiyeköy — birlikte akşam yemeği.',
      description: 'Gayrettepe-Mecidiyeköy’de İtalyan mutfağı lezzetleri; birlikte keyifli bir akşam yemeği.',
      kind: EventKind.TRIP,
      categorySlug: 'food-drink',
      venueSlug: 'gayrettepe-mecidiyekoy',
      startsAt: '2026-04-17T19:00:00+03:00',
      endsAt: '2026-04-17T22:00:00+03:00',
      status: EventStatus.PUBLISHED,
    },
    {
      slug: 'kent-ormani-yuruyus',
      title: 'Atatürk Kent Ormanı · Kahve & Yürüyüş',
      tagline: 'Kahve, yürüyüş, sohbet ve oyunlar.',
      description: "Atatürk Kent Ormanı'nda kahve, yürüyüş, sohbet ve çeşitli oyunlar eşliğinde keyifli bir gün.",
      kind: EventKind.TRIP,
      categorySlug: 'outdoor-spor',
      venueSlug: 'ataturk-kent-ormani',
      startsAt: '2026-04-15T10:00:00+03:00',
      endsAt: '2026-04-15T14:00:00+03:00',
      status: EventStatus.PUBLISHED,
    },
    {
      slug: 'kutu-oyunu-aksami',
      title: 'Kutu Oyunu Akşamı',
      tagline: 'Kadıköy — tatlı ve kahve eşliğinde kutu oyunları.',
      description: "Kadıköy'de tatlı ve kahve eşliğinde kutu oyunları oynayıp eğlendiğimiz güzel bir akşam. Saat 19:30.",
      kind: EventKind.TRIP,
      categorySlug: 'social',
      venueSlug: 'kadikoy-merkez',
      startsAt: '2026-04-24T19:30:00+03:00',
      endsAt: '2026-04-24T22:30:00+03:00',
      status: EventStatus.PUBLISHED,
    },
  ];

  for (const e of events) {
    // coverUrl yalnız e.cover verilmişse yazılır (aksi halde dokunmaz → uploaded kapağı ezmez).
    const data = {
      ...(e.cover ? { coverUrl: e.cover } : {}),
      title: e.title,
      tagline: e.tagline,
      description: e.description,
      kind: e.kind,
      categoryId: cat[e.categorySlug].id,
      venueId: e.venueSlug ? ven[e.venueSlug].id : undefined,
      startsAt: new Date(e.startsAt),
      endsAt: new Date(e.endsAt),
      status: e.status,
      publishedAt: now,
      campingAllowed: e.campingAllowed ?? false,
      agenda: e.agenda ?? undefined,
      included: e.included ?? undefined,
      bringList: e.bringList ?? undefined,
    };
    await prisma.event.upsert({
      where: { slug: e.slug },
      update: data,
      create: { slug: e.slug, ...data },
    });
    console.log(`  ✓ ${e.title}`);
  }

  console.log(`✅  ${events.length} etkinlik içeri aktarıldı. Kapakları admin → etkinlik → "Görsel yükle" ile gerçek afişlerle değiştirebilirsin.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
