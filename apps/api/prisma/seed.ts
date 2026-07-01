import { EventKind, EventStatus, PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const days = (n: number) => new Date(Date.now() + n * 86_400_000);
const hours = (d: Date, h: number) => new Date(d.getTime() + h * 3_600_000);

async function main() {
  console.log('🌱  Seeding Luca database...');

  const passwordHash = await argon2.hash('password123');

  // ---- users ----
  const users = [
    { email: 'admin@luca.test', name: 'Luca Admin', role: Role.SUPERADMIN },
    { email: 'editor@luca.test', name: 'Luca Editor', role: Role.EDITOR },
    { email: 'door@luca.test', name: 'Door Crew', role: Role.DOOR },
    { email: 'viewer@luca.test', name: 'Viewer', role: Role.VIEWER },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name },
      create: { ...u, passwordHash },
    });
  }

  // ---- categories (8 dikey / verticals) ----
  const catData = [
    { slug: 'wellness', name: 'Wellness', icon: 'lotus', color: '#657257', position: 0 },
    { slug: 'outdoor-spor', name: 'Outdoor & Spor', icon: 'mountain', color: '#3A7D5B', position: 1 },
    { slug: 'gezi-seyahat', name: 'Gezi & Seyahat', icon: 'compass', color: '#C86B42', position: 2 },
    { slug: 'workshop', name: 'Workshop', icon: 'palette', color: '#B5852A', position: 3 },
    { slug: 'social', name: 'Social', icon: 'users', color: '#9C6B8E', position: 4 },
    { slug: 'food-drink', name: 'Food & Drink', icon: 'wine', color: '#A23E48', position: 5 },
    { slug: 'business', name: 'Business & Networking', icon: 'briefcase', color: '#3E5A78', position: 6 },
    { slug: 'nightlife', name: 'Nightlife', icon: 'disc', color: '#171717', position: 7 },
  ];
  const cat: Record<string, { id: string }> = {};
  for (const c of catData) {
    cat[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, color: c.color, position: c.position },
      create: c,
    });
  }

  // ---- venues ----
  const hangar = await prisma.venue.upsert({
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
  const bosphorus = await prisma.venue.upsert({
    where: { slug: 'luca-bosphorus' },
    update: {},
    create: {
      slug: 'luca-bosphorus',
      name: 'Luca Bosphorus',
      address: 'Kuruçeşme, Beşiktaş, İstanbul',
      city: 'İstanbul',
      country: 'TR',
      lat: 41.0573,
      lng: 29.0345,
      capacity: 120,
    },
  });
  const sapanca = await prisma.venue.upsert({
    where: { slug: 'sapanca-retreat' },
    update: {},
    create: {
      slug: 'sapanca-retreat',
      name: 'Sapanca Retreat',
      address: 'Kırkpınar, Sapanca, Sakarya',
      city: 'Sakarya',
      country: 'TR',
      lat: 40.6917,
      lng: 30.2647,
      capacity: 80,
    },
  });

  // ---- artists / instructors / djs ----
  const a = await Promise.all(
    [
      { slug: 'kaan-duru', name: 'Kaan Duru', isResident: true, country: 'TR' },
      { slug: 'selin-peri', name: 'Selin Peri', isResident: true, country: 'TR' },
      { slug: 'marlon-hoffman', name: 'Marlon Hoffman', isResident: false, country: 'DE' },
      { slug: 'ece-tuana', name: 'Ece Tuana', isResident: false, country: 'TR', bio: 'Yoga & nefes eğitmeni' },
      { slug: 'derya-akin', name: 'Derya Akın', isResident: false, country: 'TR', bio: 'Reformer pilates eğitmeni' },
      { slug: 'mert-can', name: 'Mert Can', isResident: false, country: 'TR', bio: 'Seramik sanatçısı' },
    ].map((x) => prisma.artist.upsert({ where: { slug: x.slug }, update: {}, create: x })),
  );
  const by = (slug: string) => a.find((x) => x.slug === slug)!;

  type Tier = { name: string; priceMinor: number; capacity: number; sold?: number; position: number };
  type EvSpec = {
    slug: string;
    title: string;
    tagline?: string;
    description?: string;
    kind: EventKind;
    categorySlug: string;
    venueId?: string;
    inDays: number;
    durationH?: number;
    status?: EventStatus;
    agenda?: { time: string; title: string }[];
    included?: string[];
    bringList?: string[];
    ageMin?: number;
    campingAllowed?: boolean;
    travelInfo?: string;
    tickets: Tier[];
    lineup?: { slug: string; headline?: boolean; stage?: string }[];
  };

  const events: EvSpec[] = [
    {
      slug: 'sunset-yoga-sound-healing',
      title: 'Sunset Yoga & Sound Healing',
      tagline: 'Boğaz manzarasında gün batımı akışı.',
      description: 'Nazik bir vinyasa akışı, nefes çalışması ve sound healing ile haftaya hazırlan.',
      kind: EventKind.PARTY,
      categorySlug: 'wellness',
      venueId: bosphorus.id,
      inDays: 5,
      durationH: 3,
      status: EventStatus.PUBLISHED,
      agenda: [
        { time: '17:30', title: 'Check-in & karşılama çayı' },
        { time: '18:00', title: 'Vinyasa akış' },
        { time: '19:00', title: 'Nefes & meditasyon' },
        { time: '19:30', title: 'Sound healing' },
        { time: '20:00', title: 'Sosyalleşme' },
      ],
      included: ['Yoga matı', 'Bitki çayı', 'Sağlıklı atıştırmalık'],
      bringList: ['Rahat kıyafet', 'Su matarası'],
      tickets: [
        { name: 'Erken Kuş', priceMinor: 55000, capacity: 20, sold: 20, position: 0 },
        { name: 'Standart', priceMinor: 75000, capacity: 40, sold: 12, position: 1 },
        { name: 'Çift Bilet', priceMinor: 130000, capacity: 20, sold: 4, position: 2 },
      ],
      lineup: [{ slug: 'ece-tuana', headline: true, stage: 'Garden' }],
    },
    {
      slug: 'sabah-reformer-pilates',
      title: 'Sabah Reformer Pilates',
      tagline: 'Güne core gücüyle başla.',
      kind: EventKind.PARTY,
      categorySlug: 'wellness',
      venueId: bosphorus.id,
      inDays: 3,
      durationH: 1,
      status: EventStatus.PUBLISHED,
      included: ['Reformer makinesi', 'Havlu'],
      ageMin: 16,
      tickets: [
        { name: 'Tek Ders', priceMinor: 45000, capacity: 12, sold: 12, position: 0 },
        { name: '4 Ders Paketi', priceMinor: 160000, capacity: 12, sold: 5, position: 1 },
      ],
      lineup: [{ slug: 'derya-akin', headline: true }],
    },
    {
      slug: 'belgrad-sabah-kosusu',
      title: 'Belgrad Ormanı Koşu Kulübü + Kahvaltı',
      tagline: 'Koş, tanış, kahvaltı et.',
      kind: EventKind.PARTY,
      categorySlug: 'outdoor-spor',
      inDays: 6,
      durationH: 3,
      status: EventStatus.PUBLISHED,
      included: ['Rehber eşliğinde 5K', 'Açık hava kahvaltısı'],
      bringList: ['Koşu ayakkabısı', 'Şapka'],
      tickets: [{ name: 'Katılım', priceMinor: 25000, capacity: 60, sold: 23, position: 0 }],
    },
    {
      slug: 'bogaz-gun-batimi-tekne',
      title: "Boğaz'da Gün Batımı Tekne Turu",
      tagline: 'İki yaka, bir gün batımı.',
      kind: EventKind.TRIP,
      categorySlug: 'gezi-seyahat',
      venueId: bosphorus.id,
      inDays: 9,
      durationH: 3,
      status: EventStatus.PUBLISHED,
      included: ['Tekne turu', 'Akustik müzik', 'İçecek ikramı'],
      ageMin: 18,
      tickets: [
        { name: 'Standart', priceMinor: 95000, capacity: 50, sold: 18, position: 0 },
        { name: 'VIP Güverte', priceMinor: 150000, capacity: 16, sold: 6, position: 1 },
      ],
    },
    {
      slug: 'seramik-atolyesi-kupa',
      title: 'Seramik Atölyesi: El Yapımı Kupa',
      tagline: 'Çamurla bir akşam.',
      kind: EventKind.PARTY,
      categorySlug: 'workshop',
      venueId: hangar.id,
      inDays: 7,
      durationH: 3,
      status: EventStatus.PUBLISHED,
      included: ['Tüm malzemeler', 'Pişirim & sırlama', '1 içecek'],
      tickets: [{ name: 'Atölye', priceMinor: 65000, capacity: 16, sold: 9, position: 0 }],
      lineup: [{ slug: 'mert-can', headline: true, stage: 'Atölye' }],
    },
    {
      slug: 'pazar-brunch-tanisma',
      title: 'Pazar Brunch & Yeni Tanışmalar',
      tagline: 'Sofrada yeni arkadaşlar.',
      kind: EventKind.PARTY,
      categorySlug: 'social',
      venueId: bosphorus.id,
      inDays: 4,
      durationH: 3,
      status: EventStatus.PUBLISHED,
      included: ['Serpme brunch', 'Sınırsız çay', 'Tanışma oyunları'],
      tickets: [{ name: 'Brunch', priceMinor: 60000, capacity: 40, sold: 27, position: 0 }],
    },
    {
      slug: 'rooftop-sarap-peynir',
      title: 'Rooftop Şarap & Peynir Tadımı',
      tagline: 'Şehrin üstünde bir tadım.',
      kind: EventKind.PARTY,
      categorySlug: 'food-drink',
      venueId: hangar.id,
      inDays: 11,
      durationH: 3,
      status: EventStatus.PUBLISHED,
      included: ['5 şarap', 'Eşleştirilmiş peynir tabağı'],
      ageMin: 18,
      tickets: [{ name: 'Tadım', priceMinor: 120000, capacity: 30, sold: 8, position: 0 }],
    },
    {
      slug: 'founders-breakfast',
      title: 'Founders Breakfast · Networking',
      tagline: 'Kurucular ve creatorlar için sabah buluşması.',
      kind: EventKind.PARTY,
      categorySlug: 'business',
      venueId: bosphorus.id,
      inDays: 8,
      durationH: 2,
      status: EventStatus.PUBLISHED,
      included: ['Kahvaltı', 'Yapılandırılmış networking', 'Konuşmacı'],
      tickets: [
        { name: 'Standart', priceMinor: 50000, capacity: 50, sold: 31, position: 0 },
        { name: 'Sınırlı VIP Masa', priceMinor: 90000, capacity: 10, sold: 10, position: 1 },
      ],
    },
    {
      slug: 'luca-006-kadikoy',
      title: 'Luca 006 · Kadıköy',
      tagline: "Bir yaz gecesi, Moda'da.",
      description: "Luca Network'ün 6. gecesi. Kapılar 22:00'de. 18+ kimlik zorunlu.",
      kind: EventKind.PARTY,
      categorySlug: 'nightlife',
      venueId: hangar.id,
      inDays: 30,
      durationH: 8,
      status: EventStatus.PUBLISHED,
      ageMin: 18,
      tickets: [
        { name: 'Early Bird', priceMinor: 45000, capacity: 150, sold: 150, position: 0 },
        { name: 'Regular', priceMinor: 65000, capacity: 450, sold: 120, position: 1 },
        { name: 'Last Release', priceMinor: 85000, capacity: 200, sold: 0, position: 2 },
      ],
      lineup: [
        { slug: 'kaan-duru', headline: true, stage: 'Main' },
        { slug: 'selin-peri', stage: 'Main' },
        { slug: 'marlon-hoffman', stage: 'Main' },
      ],
    },
    {
      slug: 'luca-camp-2026',
      title: 'Luca Camp · 2026',
      tagline: 'Üç gün, iki gece, bir orman.',
      description: "Luca'nın kamp festivali. Konaklama, shuttle ve yemek paketleri dahil.",
      kind: EventKind.CAMP,
      categorySlug: 'gezi-seyahat',
      venueId: sapanca.id,
      inDays: 120,
      durationH: 72,
      status: EventStatus.PUBLISHED,
      campingAllowed: true,
      travelInfo: "İstanbul'dan shuttle kalkar. Detay yayında.",
      included: ['2 gece konaklama', 'Tüm öğünler', 'Shuttle', 'Atölyeler'],
      bringList: ['Uyku tulumu', 'Mont', 'Su şişesi'],
      tickets: [
        { name: 'Paylaşımlı Oda', priceMinor: 350000, capacity: 40, sold: 11, position: 0 },
        { name: 'Çift Kişilik Oda', priceMinor: 550000, capacity: 20, sold: 3, position: 1 },
        { name: 'Glamping Çadırı', priceMinor: 950000, capacity: 10, sold: 0, position: 2 },
      ],
      lineup: [
        { slug: 'ece-tuana', headline: true, stage: 'Meadow' },
        { slug: 'kaan-duru', stage: 'Forest' },
      ],
    },
  ];

  let upcomingSlug = '';
  for (const e of events) {
    const start = hours(days(e.inDays), 10);
    const created = await prisma.event.upsert({
      where: { slug: e.slug },
      update: {
        categoryId: cat[e.categorySlug].id,
        status: e.status ?? EventStatus.PUBLISHED,
        coverUrl: `/img/events/${e.slug}.jpg`,
      },
      create: {
        slug: e.slug,
        title: e.title,
        tagline: e.tagline,
        description: e.description,
        coverUrl: `/img/events/${e.slug}.jpg`,
        kind: e.kind,
        categoryId: cat[e.categorySlug].id,
        venueId: e.venueId,
        startsAt: start,
        endsAt: hours(start, e.durationH ?? 3),
        doorsAt: e.kind === EventKind.PARTY ? hours(start, -0.5) : undefined,
        status: e.status ?? EventStatus.PUBLISHED,
        publishedAt: new Date(),
        agenda: e.agenda ?? undefined,
        included: e.included ?? undefined,
        bringList: e.bringList ?? undefined,
        ageMin: e.ageMin,
        campingAllowed: e.campingAllowed ?? false,
        travelInfo: e.travelInfo,
        tickets: { create: e.tickets },
        lineup: e.lineup
          ? {
              create: e.lineup.map((l, i) => ({
                artistId: by(l.slug).id,
                order: i,
                isHeadline: l.headline ?? false,
                stage: l.stage,
              })),
            }
          : undefined,
      },
    });
    if (!upcomingSlug) upcomingSlug = created.slug;
  }

  // ---- past party (archive) ----
  await prisma.event.upsert({
    where: { slug: 'luca-005-atolye' },
    update: { categoryId: cat['nightlife'].id },
    create: {
      slug: 'luca-005-atolye',
      title: 'Luca 005 · Atölye',
      kind: EventKind.PARTY,
      categoryId: cat['nightlife'].id,
      startsAt: days(-45),
      endsAt: hours(days(-45), 8),
      venueId: hangar.id,
      status: EventStatus.ARCHIVED,
      publishedAt: days(-50),
      isSoldOut: true,
      lineup: {
        create: [
          { artistId: by('selin-peri').id, order: 0, isHeadline: true, stage: 'Main' },
          { artistId: by('kaan-duru').id, order: 1, isHeadline: false, stage: 'Main' },
        ],
      },
    },
  });

  // ---- a sample reservation (nightclub table) ----
  await prisma.reservation.upsert({
    where: { code: 'RES-DEMO01' },
    update: {},
    create: {
      code: 'RES-DEMO01',
      venueId: hangar.id,
      area: 'VIP',
      date: hours(days(30), 22),
      partySize: 6,
      fullName: 'Deniz Yılmaz',
      phone: '+90 555 000 0000',
      email: 'deniz@example.com',
      note: 'Doğum günü kutlaması',
    },
  });
  await prisma.reservation.upsert({
    where: { code: 'RES-DEMO02' },
    update: {},
    create: {
      code: 'RES-DEMO02',
      venueId: hangar.id,
      area: 'Lounge',
      date: hours(days(12), 21),
      partySize: 4,
      fullName: 'Ece Demir',
      phone: '+90 555 111 2233',
      email: 'ece@example.com',
      status: 'CONFIRMED',
      note: 'Pencere kenarı',
    },
  });
  await prisma.reservation.upsert({
    where: { code: 'RES-DEMO03' },
    update: {},
    create: {
      code: 'RES-DEMO03',
      venueId: hangar.id,
      area: 'VIP',
      date: hours(days(20), 23),
      partySize: 8,
      fullName: 'Mert Kaya',
      phone: '+90 555 444 5566',
      email: 'mert@example.com',
      status: 'PENDING',
    },
  });

  // ---------- başvurular / mesajlar ----------
  const submissions: any[] = [
    { type: 'CONTACT', name: 'Selin A.', email: 'selin@example.com', subject: 'Genel soru', message: 'Etkinliklere nasıl katılabilirim?', status: 'NEW' },
    { type: 'EVENT_PROPOSAL', name: 'Burak Yıldız', email: 'burak@example.com', phone: '+90 555 222 3344', subject: 'DJ gecesi önerisi', message: "Kadıköy'de bir mekan için organizasyon yapmak istiyoruz.", status: 'NEW' },
    { type: 'MEMBERSHIP', name: 'Aylin Toprak', email: 'aylin@example.com', subject: 'Üyelik', message: 'Topluluğa katılmak istiyorum.', status: 'REVIEWED' },
    { type: 'CONTACT', name: 'Can Öz', email: 'can@example.com', subject: 'İş birliği', message: 'Sponsorluk görüşmesi yapmak isteriz.', status: 'NEW' },
  ];
  for (const s of submissions) {
    const exists = await prisma.submission.findFirst({ where: { email: s.email, subject: s.subject } });
    if (!exists) await prisma.submission.create({ data: s });
  }

  // ---------- kuponlar ----------
  const coupons: any[] = [
    { code: 'HOSGELDIN', type: 'PERCENT', value: 15, maxUses: 100, isActive: true },
    { code: 'YAZ50', type: 'FIXED', value: 5000, maxUses: 50, minSubtotalMinor: 20000, isActive: true },
    { code: 'VIP10', type: 'PERCENT', value: 10, isActive: false },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: {}, create: c });
  }

  // ---------- içerik sayfaları (admin'den düzenlenebilir) ----------
  const pages = [
    {
      slug: 'hakkimizda',
      title: 'Tek çatı, sekiz dünya.',
      excerpt:
        "Luca; wellness'tan tekneye, atölyeden sahneye İstanbul'un sekiz dünyasını bir araya getiren etkinlik platformu.",
      content: `## Biz kimiz
Luca, İstanbul'da yaşamı tek bir geceye sığdırmayan bir etkinlik ve topluluk platformudur. Sabah yogasından tekne turuna, seramik atölyesinden çatı katı konserine — şehrin nefes alan her anını tek bir yerde topluyoruz.

## Sekiz dünya
- Wellness
- Outdoor & Spor
- Gezi & Seyahat
- Workshop
- Social
- Food & Drink
- Business
- Nightlife

## Nasıl çalışır
Üye ol, ilgi alanlarını seç; sana uygun etkinlikler akışına düşsün. Yerini ayır, biletini al, kapıda QR ile saniyeler içinde içeri gir.`,
    },
    {
      slug: 'guvenlik',
      title: 'Güvenliğin bizim için öncelik.',
      excerpt:
        'Hesap, ödeme ve veri güvenliği için sektör standardı önlemler alıyoruz.',
      content: `## Hesap güvenliği
Şifreler sunucularımızda düz metin tutulmaz; modern bir algoritmayla (argon2) özetlenerek saklanır. Oturumlar kısa ömürlü güvenli jetonlarla yönetilir.

## Ödeme güvenliği
Tüm trafik SSL/TLS ile şifrelenir. Kart bilgilerin Luca sunucularında saklanmaz; ödemeler 3D Secure üzerinden alınır.

## Veri ve gizlilik
Kişisel verilerini yalnızca hizmeti sunmak için, KVKK'ya uygun şekilde işleriz. İstediğin an hesabını ve verilerini silebilirsin.`,
    },
  ];
  for (const p of pages) {
    await prisma.page.upsert({
      where: { slug: p.slug },
      update: { title: p.title, excerpt: p.excerpt, content: p.content },
      create: p,
    });
  }

  // ---------- örnek blog yazıları ----------
  const posts = [
    {
      slug: 'lucaya-hos-geldin',
      title: "Luca'ya hoş geldin: Şehrin sekiz dünyası",
      excerpt:
        'Sadece gece değil — sabah yogasından tekne turuna kadar tek bir akışta keşfet.',
      coverUrl: '/img/events/sunset-yoga-sound-healing.jpg',
      content: `Luca, İstanbul'da yaşamı bütün bir haftaya yayar. Bu ilk yazıda platformu ve sekiz dünyamızı kısaca tanıtıyoruz.

## Neden Luca?
Çünkü doğru anı, doğru insanlarla bir araya getirmek bir bilet meselesi değil; bir his, bir ritim ve bir topluluk meselesidir.

## Nasıl başlarsın?
Üye ol, ilgi alanlarını seç ve sana özel akışı keşfet.`,
    },
    {
      slug: 'hafta-sonu-rehberi',
      title: 'Hafta sonu için 5 etkinlik fikri',
      excerpt:
        'Boğaz turundan seramik atölyesine, hafta sonunu dolu dolu geçirmenin yolları.',
      coverUrl: '/img/events/bogaz-gun-batimi-tekne.jpg',
      content: `Hafta sonu yaklaşıyor ve planın yok mu? İşte Luca'dan beş fikir.

## 1. Boğaz'da gün batımı
Tekneyle şehre yukarıdan bak.

## 2. Sabah koşusu
Belgrad Ormanı'nda güne erken başla.

## 3. Seramik atölyesi
Ellerinle bir şey üret, zihnini boşalt.`,
    },
    {
      slug: 'rooftopta-sarap-ve-peynir',
      title: "Rooftop'ta şarap & peynir: Akşamı yavaşlatmak",
      excerpt: 'İyi bir kadeh, doğru eşlikçiler ve şehrin ışıkları — akşamı bir ritüele çevirmek.',
      coverUrl: '/img/events/rooftop-sarap-peynir.jpg',
      content: `Bazen en iyi gece, koşuşturmanın değil; yavaşlamanın gecesidir.

## Eşleştirmenin temeli
Ağır bir kırmızıyı olgun bir peynirle, taze bir beyazı keçi peyniriyle düşün. Kural yok; damağına güven.

## Manzara da bir tat
Şehrin ışıkları masanın bir parçası. Luca rooftop buluşmalarında yeni insanlarla tanışırken kadehini de keşfedersin.`,
    },
    {
      slug: 'sabah-kosusu-neden-her-seyi-degistirir',
      title: 'Sabah koşusu neden her şeyi değiştiriyor?',
      excerpt: "Belgrad Ormanı'nda güne erken başlamanın bedenine ve zihnine etkisi.",
      coverUrl: '/img/events/belgrad-sabah-kosusu.jpg',
      content: `Erken kalkmak zor; ama ilk adımdan sonra her şey değişir.

## Beden uyanır
Sabah hareketi metabolizmayı çalıştırır, gün boyu enerjini dengeler.

## Zihin temizlenir
Ağaçların altında, telefon olmadan atılan birkaç kilometre en iyi meditasyondur. Tek başına zor geliyorsa toplulukla koş — Luca grup koşuları tam bunun için.`,
    },
    {
      slug: 'atolyede-uretmenin-terapisi',
      title: 'Atölyede üretmenin terapisi',
      excerpt: 'Seramikten ahşaba: ellerinle bir şey yapmak neden iyi geliyor?',
      coverUrl: '/img/events/seramik-atolyesi-kupa.jpg',
      content: `Bir şeyi sıfırdan üretmek, zihni bugünün gürültüsünden koparır.

## Akış hâli
Çamur tornadayken ne dünü düşünürsün ne yarını; sadece an vardır. Psikologların "flow" dediği bu hâl en iyi dinlenmedir.

## Eve bir hatıra
Kendi yaptığın kupadan içtiğin ilk kahvenin tadı başkadır. Atölyelerimizde malzeme de eğitmen de hazır; sen sadece gel.`,
    },
    {
      slug: 'ilk-festival-kampina-hazirlik',
      title: 'Kamp 101: İlk festival-kampına hazırlık',
      excerpt: 'Çadırdan çantaya, ilk konaklamalı etkinliğine sorunsuz gitmenin yolu.',
      coverUrl: '/img/events/luca-camp-2026.jpg',
      content: `İlk kampın heyecan verici — biraz hazırlıkla çok daha keyifli olur.

## Olmazsa olmazlar
Katmanlı giysi, kafa lambası, powerbank, su matarası ve rahat ayakkabı.

## Gece için
Akşam serinler; bir polar ve uyku tulumu seni kurtarır. Gerisi müzik, ateş ve yeni dostlar. Luca kamplarında lojistik bizde, anılar sende.`,
    },
    {
      slug: 'networking-sevmeyenler-icin-networking',
      title: "Networking'i sevmeyenler için networking",
      excerpt: 'Kartvizit dağıtmadan, samimi şekilde değerli bağlantılar kurmanın yolu.',
      coverUrl: '/img/events/founders-breakfast.jpg',
      content: `"Networking" kelimesi kulağa soğuk gelir; oysa mesele insan tanımaktır.

## Soru sor, satış yapma
İyi bağlantı, ne iş yaptığını anlatmakla değil; karşındakini gerçekten dinlemekle kurulur.

## Küçük masalar kazanır
Kalabalık salonlar yerine küçük kahvaltı buluşmaları daha derin sohbet getirir. Luca founder kahvaltıları tam ölçekte: tanı, paylaş, birlikte büyü.`,
    },
    {
      slug: 'kadikoy-gecesi-sehrin-ritmi',
      title: 'Kadıköy gecesi: Şehrin ritmini bulmak',
      excerpt: 'Plaktan sahaya, Kadıköy gecelerini özel yapan o enerji.',
      coverUrl: '/img/events/luca-006-kadikoy.jpg',
      content: `Kadıköy geceleri kendi kuralını koyar: serbest, içten ve müzikle dolu.

## Önce kulak
İyi bir gece iyi bir line-up'la başlar. Sahnedeki ismi tanımasan da bir akşam onu keşfetmek en güzeli.

## Sonra topluluk
Aynı şarkıya kapılan yabancılar gece bitmeden tanıdık olur. Luca gecelerinde kapıda kim olduğun değil, nasıl dans ettiğin önemli.`,
    },
  ];
  for (const p of posts) {
    await prisma.post.upsert({
      where: { slug: p.slug },
      update: { title: p.title, excerpt: p.excerpt, coverUrl: p.coverUrl, content: p.content },
      create: { ...p, status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  // ---------- demo topluluk aktivitesi (liderlik + skor + takvim dolsun) ----------
  const demoMembers = [
    { email: 'ayse@luca.test', name: 'Ayşe Kaya', city: 'İstanbul', interests: ['wellness', 'workshop'] },
    { email: 'mehmet@luca.test', name: 'Mehmet Demir', city: 'İstanbul', interests: ['nightlife', 'social'] },
    { email: 'zeynep@luca.test', name: 'Zeynep Arslan', city: 'İzmir', interests: ['workshop', 'food-drink'] },
    { email: 'can@luca.test', name: 'Can Yılmaz', city: 'İstanbul', interests: ['outdoor-spor'] },
    { email: 'elif@luca.test', name: 'Elif Şahin', city: 'Ankara', interests: ['gezi-seyahat'] },
    { email: 'burak@luca.test', name: 'Burak Öztürk', city: 'İstanbul', interests: ['business'] },
  ];
  const memberId: Record<string, string> = {};
  for (const m of demoMembers) {
    const u = await prisma.user.upsert({
      where: { email: m.email },
      update: { name: m.name, city: m.city },
      create: {
        email: m.email, name: m.name, city: m.city, interests: m.interests,
        role: Role.VIEWER, passwordHash, emailVerified: true,
      },
    });
    memberId[m.email] = u.id;
  }
  const viewer = await prisma.user.findUnique({ where: { email: 'viewer@luca.test' } });
  if (viewer) memberId['viewer@luca.test'] = viewer.id;

  const allEvents = await prisma.event.findMany({ select: { id: true }, orderBy: { startsAt: 'asc' } });
  const ev = (i: number) => allEvents[((i % allEvents.length) + allEvents.length) % allEvents.length]?.id;

  // (email, sipariş, favori, yorum) — sıralı liderlik oluşturur
  const activity = [
    { email: 'ayse@luca.test', orders: 3, favs: 5, reviews: 2 },
    { email: 'mehmet@luca.test', orders: 2, favs: 4, reviews: 2 },
    { email: 'viewer@luca.test', orders: 2, favs: 4, reviews: 1 },
    { email: 'zeynep@luca.test', orders: 2, favs: 3, reviews: 1 },
    { email: 'can@luca.test', orders: 1, favs: 3, reviews: 1 },
    { email: 'elif@luca.test', orders: 1, favs: 2, reviews: 0 },
    { email: 'burak@luca.test', orders: 0, favs: 2, reviews: 1 },
  ];

  if (allEvents.length > 0) {
    for (let pi = 0; pi < activity.length; pi++) {
      const p = activity[pi];
      const uid = memberId[p.email];
      if (!uid) continue;
      for (let i = 0; i < p.favs; i++) {
        const eid = ev(pi * 3 + i);
        if (eid)
          await prisma.favorite.upsert({
            where: { userId_eventId: { userId: uid, eventId: eid } }, update: {}, create: { userId: uid, eventId: eid },
          });
      }
      for (let i = 0; i < p.reviews; i++) {
        const eid = ev(pi * 2 + i + 1);
        if (eid)
          await prisma.review.upsert({
            where: { userId_eventId: { userId: uid, eventId: eid } },
            update: {},
            create: { userId: uid, eventId: eid, rating: 4 + (i % 2), comment: 'Harikaydı, tekrar bekleriz!' },
          });
      }
      for (let i = 0; i < p.orders; i++) {
        const eid = ev(pi + i);
        if (!eid) continue;
        const code = `SEED-${pi}-${i}`;
        await prisma.order.upsert({
          where: { code },
          update: {},
          create: {
            code, eventId: eid, userId: uid, email: p.email, fullName: p.email.split('@')[0],
            totalMinor: 45000, currency: 'TRY', provider: 'seed', status: 'PAID', paidAt: new Date(),
          },
        });
      }
    }
  }

  // ---------- demo canlı yayın (harita canlı pin + /canli dolsun) ----------
  // Yalnız dokunulmamışsa ayarla (admin kapatırsa seed geri açmaz).
  await prisma.event.updateMany({
    where: { slug: upcomingSlug || 'sunset-yoga-sound-healing', liveStatus: 'OFFLINE', streamUrl: null },
    data: {
      liveStatus: 'LIVE',
      streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // Mux herkese açık test HLS
      streamAccess: 'PUBLIC',
      liveStartedAt: new Date(),
    },
  });

  console.log('✅  Seed complete.');
  console.log(`   Categories: ${catData.length} · Events: ${events.length + 1}`);
  console.log(`   First upcoming: ${upcomingSlug}`);
  console.log(`   Demo üyeler: ${demoMembers.length} (liderlik/skor/takvim dolu)`);
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
