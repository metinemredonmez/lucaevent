import { EventKind, EventStatus, PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding Luca database...');

  const passwordHash = await argon2.hash('password123');

  // ---- users ----
  const users = [
    { email: 'admin@luca.test',  name: 'Luca Admin',  role: Role.SUPERADMIN },
    { email: 'editor@luca.test', name: 'Luca Editor', role: Role.EDITOR },
    { email: 'door@luca.test',   name: 'Door Crew',     role: Role.DOOR },
    { email: 'viewer@luca.test', name: 'Viewer',        role: Role.VIEWER },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name },
      create: { ...u, passwordHash },
    });
  }

  // ---- venue ----
  const venue = await prisma.venue.upsert({
    where: { slug: 'kadikoy-hangar' },
    update: {},
    create: {
      slug: 'kadikoy-hangar',
      name: 'Kadıköy Hangar',
      address: 'Moda Cad. No:1, Kadıköy, İstanbul',
      city: 'İstanbul',
      country: 'TR',
      lat: 40.9849,
      lng: 29.0257,
      capacity: 800,
    },
  });

  // ---- artists ----
  const artists = await Promise.all(
    [
      { slug: 'kaan-duru',     name: 'Kaan Duru',     isResident: true,  country: 'TR' },
      { slug: 'selin-peri',    name: 'Selin Peri',    isResident: true,  country: 'TR' },
      { slug: 'marlon-hoffman', name: 'Marlon Hoffman', isResident: false, country: 'DE' },
      { slug: 'ece-tuana',     name: 'Ece Tuana',     isResident: false, country: 'TR' },
    ].map((a) =>
      prisma.artist.upsert({ where: { slug: a.slug }, update: {}, create: a }),
    ),
  );

  // ---- event: upcoming party ----
  const upcoming = await prisma.event.upsert({
    where: { slug: 'luca-006-kadikoy' },
    update: {},
    create: {
      slug: 'luca-006-kadikoy',
      title: 'Luca 006 · Kadıköy',
      tagline: 'Bir yaz gecesi, Moda\'da.',
      description:
        'Luca Network\'ün 6. gecesi. Kapılar 22:00\'de. Bilet sayısı sınırlı. 18+ kimlik zorunlu.',
      kind: EventKind.PARTY,
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // +30 days
      endsAt:   new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 + 1000 * 60 * 60 * 8),
      doorsAt:  new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 - 1000 * 60 * 60),
      venueId: venue.id,
      status: EventStatus.PUBLISHED,
      publishedAt: new Date(),
      tickets: {
        create: [
          { name: 'Early Bird', priceMinor: 45000, capacity: 150, sold: 150, position: 0 },
          { name: 'Regular',    priceMinor: 65000, capacity: 450, sold: 120, position: 1 },
          { name: 'Last Release', priceMinor: 85000, capacity: 200, sold: 0,  position: 2 },
        ],
      },
      lineup: {
        create: [
          { artistId: artists[0].id, order: 0, isHeadline: true,  stage: 'Main' },
          { artistId: artists[1].id, order: 1, isHeadline: false, stage: 'Main' },
          { artistId: artists[2].id, order: 2, isHeadline: false, stage: 'Main' },
        ],
      },
    },
  });

  // ---- event: upcoming camp festival ----
  await prisma.event.upsert({
    where: { slug: 'luca-camp-2026' },
    update: {},
    create: {
      slug: 'luca-camp-2026',
      title: 'Luca Camp · 2026',
      tagline: 'Üç gün, iki gece, bir orman.',
      description:
        'Luca\'nın ilk kamp festivali. Konaklama, shuttle ve yemek paketleri dahil.',
      kind: EventKind.CAMP,
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120),
      endsAt:   new Date(Date.now() + 1000 * 60 * 60 * 24 * 123),
      status: EventStatus.PUBLISHED,
      publishedAt: new Date(),
      campingAllowed: true,
      travelInfo: 'İstanbul\'dan shuttle kalkar. Detay yayında.',
      faq: [
        { q: 'Ne getirmeliyim?', a: 'Çadır, uyku tulumu, su şişesi, güneş kremi.' },
        { q: 'Hayvan getirebilir miyim?', a: 'Hayır.' },
      ],
      tickets: {
        create: [
          { name: '3 Gün Kamp', priceMinor: 350000, capacity: 500, sold: 0, position: 0 },
          { name: 'Glamping Çadırı', priceMinor: 950000, capacity: 40, sold: 0, position: 1 },
        ],
      },
      lineup: {
        create: [
          { artistId: artists[0].id, order: 0, isHeadline: true,  stage: 'Meadow' },
          { artistId: artists[3].id, order: 1, isHeadline: false, stage: 'Forest' },
        ],
      },
    },
  });

  // ---- event: past party (archive) ----
  await prisma.event.upsert({
    where: { slug: 'luca-005-atolye' },
    update: {},
    create: {
      slug: 'luca-005-atolye',
      title: 'Luca 005 · Atölye',
      kind: EventKind.PARTY,
      startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
      endsAt:   new Date(Date.now() - 1000 * 60 * 60 * 24 * 45 + 1000 * 60 * 60 * 8),
      venueId: venue.id,
      status: EventStatus.ARCHIVED,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50),
      isSoldOut: true,
      lineup: {
        create: [
          { artistId: artists[1].id, order: 0, isHeadline: true, stage: 'Main' },
          { artistId: artists[0].id, order: 1, isHeadline: false, stage: 'Main' },
        ],
      },
    },
  });

  console.log('✅  Seed complete.');
  console.log(`   Upcoming event: ${upcoming.slug}`);
  console.log('   Login: admin@luca.test / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
