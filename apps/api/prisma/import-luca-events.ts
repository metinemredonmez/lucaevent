/**
 * @luca.club.tr Instagram etkinliklerini birebir içeri aktarır (idempotent, slug'a göre upsert).
 * Çalıştır (prod): cd apps/api && pnpm import:events
 * Demo etkinlikleri SİLMEZ; sadece bu gerçek etkinlikleri ekler/günceller.
 */
import { EventKind, EventStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎫  Luca gerçek etkinlikleri içeri aktarılıyor…');

  // --- kategoriler (varsa günceller, yoksa oluşturur) ---
  const catData = [
    { slug: 'workshop', name: 'Workshop', icon: 'palette', color: '#B5852A', position: 3 },
    { slug: 'wellness', name: 'Wellness', icon: 'lotus', color: '#657257', position: 0 },
    { slug: 'nightlife', name: 'Nightlife', icon: 'disc', color: '#171717', position: 7 },
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
  const sishane = await prisma.venue.upsert({
    where: { slug: 'sishane-beyoglu' },
    update: {},
    create: {
      slug: 'sishane-beyoglu',
      name: 'Şişhane · Teras (Beyoğlu)',
      address: 'Şişhane, Beyoğlu, İstanbul',
      city: 'İstanbul',
      country: 'TR',
      lat: 41.0293,
      lng: 28.9738,
      capacity: 30,
    },
  });
  const burgazada = await prisma.venue.upsert({
    where: { slug: 'burgazada' },
    update: {},
    create: {
      slug: 'burgazada',
      name: 'Burgazada',
      address: 'Burgazada, Adalar, İstanbul',
      city: 'İstanbul',
      country: 'TR',
      lat: 40.8797,
      lng: 29.0686,
      capacity: 40,
    },
  });
  const tekne = await prisma.venue.upsert({
    where: { slug: 'bogaz-tekne' },
    update: {},
    create: {
      slug: 'bogaz-tekne',
      name: 'Boğaz · Tekne',
      address: 'İstanbul Boğazı (tekne)',
      city: 'İstanbul',
      country: 'TR',
      lat: 41.045,
      lng: 29.035,
      capacity: 100,
    },
  });

  type Ev = {
    slug: string;
    title: string;
    tagline?: string;
    description?: string;
    kind: EventKind;
    categorySlug: string;
    venueId: string;
    startsAt: string;
    endsAt: string;
    status: EventStatus;
    agenda?: { time: string; title: string }[];
    included?: string[];
    bringList?: string[];
  };

  const events: Ev[] = [
    {
      slug: 'parfum-workshopu',
      title: 'Parfüm Workshopu',
      tagline: 'Kendi kokunu keşfet — terasta deniz manzarasına karşı.',
      description:
        "İstanbul'da keyifli bir akşamda, terasta deniz manzarasına karşı parfüm dünyasına adım atıyoruz. " +
        "Toplam 60 farklı koku arasından kendi zevkine ve karakterine en uygun notaları seçecek, 2 farklı parfümü " +
        "10 ml'lik şişelerde kendin hazırlayacaksın. Kişilik testiyle sana en uygun kokuyu keşfedecek, kokunun " +
        'karakterinle nasıl bütünleştiğini deneyimleyeceksin. Hazırladığın parfümler etkinlik sonunda senin olacak.',
      kind: EventKind.TRIP,
      categorySlug: 'workshop',
      venueId: sishane.id,
      startsAt: '2026-07-10T20:00:00+03:00',
      endsAt: '2026-07-10T23:00:00+03:00',
      status: EventStatus.PUBLISHED,
      included: [
        '60 farklı koku arasından seçim',
        "2 adet 10 ml parfüm (senin olacak)",
        'Kişilik testi & koku eşleştirme',
      ],
    },
    {
      slug: 'yaza-merhaba-burgazada',
      title: 'Yaza Merhaba · Burgazada',
      tagline: 'Canlan, dengelen, temas et — bir günü kendine ayır.',
      description:
        'Birlikte yaza merhaba diyoruz! Bir günü kendine ayır; hareket et, sosyalleş, denizin ve adanın tadını çıkar. ' +
        'Yeni insanlarla tanışmak, bedenini hareket ettirmek, dinlenmek ve yazın enerjisini birlikte karşılamak için ' +
        'Burgazada’da buluşuyoruz. Her seviyeye uygundur.',
      kind: EventKind.TRIP,
      categorySlug: 'wellness',
      venueId: burgazada.id,
      startsAt: '2026-07-12T10:00:00+03:00',
      endsAt: '2026-07-12T18:00:00+03:00',
      status: EventStatus.PUBLISHED,
      agenda: [
        { time: '10:00', title: 'Yoga Etkinliği' },
        { time: '11:00', title: 'Kahvaltı' },
        { time: '13:00', title: 'Deniz Keyfi' },
        { time: '17:00', title: 'Happy Hour' },
      ],
      bringList: [
        'Yoga matı',
        'Rahat kıyafetler',
        'Deniz için gerekli eşyalar',
        'Bolca keyif ve merak',
      ],
    },
    {
      slug: '21-haziran-tekne-partisi',
      title: '21 Haziran · En Uzun Gün Tekne Partisi',
      tagline: "İstanbul Boğazı'nda DJ performansları eşliğinde dans.",
      description:
        "21 Haziran, yılın en uzun gününde İstanbul Boğazı'nda birbirinden güzel DJ performansları eşliğinde " +
        'dans ile karşıladık. Birlikte daha nice etkinliklere!',
      kind: EventKind.PARTY,
      categorySlug: 'nightlife',
      venueId: tekne.id,
      startsAt: '2026-06-21T14:00:00+03:00',
      endsAt: '2026-06-21T20:00:00+03:00',
      status: EventStatus.PUBLISHED,
    },
  ];

  for (const e of events) {
    // coverUrl bilerek set edilmiyor: olmayan dosyaya 404 gitmesin (kategori fallback'i çıkar)
    // ve tekrar çalıştırınca admin'den yüklenen gerçek afişi ezmesin.
    const data = {
      title: e.title,
      tagline: e.tagline,
      description: e.description,
      kind: e.kind,
      categoryId: cat[e.categorySlug].id,
      venueId: e.venueId,
      startsAt: new Date(e.startsAt),
      endsAt: new Date(e.endsAt),
      status: e.status,
      publishedAt: new Date(e.startsAt),
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

  console.log('✅  Bitti. Kapak görsellerini admin → etkinlik → "Görsel yükle" ile gerçek afişlerle değiştirebilirsin.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
