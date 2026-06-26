# 02 — Domain Model

Kaynak: `apps/api/prisma/schema.prisma`. Bu doküman mevcut modelleri + **eklenecek delta'ları** açıklar.

## ER (özet)
```
User ──< Order >── Event ──< TicketTier >── OrderItem >── Order
                    │  │
                    │  └──< Lineup >── Artist
                    │
                    ├── Venue
                    ├──< Media (POSTER/GALLERY/AFTERMOVIE...)
                    └── heroMedia → Media

Order ──< IssuedTicket   (QR + checkedIn)
User  ──< RefreshToken
Subscriber  (newsletter)   AuditLog  (admin izleri)
```

## Mevcut modeller
| Model | Rol | Önemli alanlar |
|---|---|---|
| **User** | Hesap + rol | email, role (enum), passwordHash, twoFaSecret, isActive |
| **RefreshToken** | Oturum rotasyonu | tokenHash, expiresAt, revokedAt |
| **Event** | Etkinlik | slug, kind (EventKind), startsAt/endsAt/doorsAt, status (EventStatus), venueId, kamp alanları (campingAllowed, campMapUrl, travelInfo, faq) |
| **Venue** | Mekân | name, address, city, lat/lng, capacity, mapStyle |
| **Artist** | Sanatçı/performer | name, bio, soundcloud/mixcloud/instagram, isResident |
| **Lineup** | Event↔Artist | stage, startsAt, isHeadline, order |
| **TicketTier** | Bilet türü | name, priceMinor, currency, capacity, sold, status (TicketStatus), salesOpen/CloseAt |
| **Order** | Sipariş | code, status (OrderStatus), email, totalMinor, provider, providerId, paidAt |
| **OrderItem** | Sipariş satırı | tierId, qty, unitMinor |
| **IssuedTicket** | Üretilen bilet | code (QR), checkedIn, checkedInAt, checkedInBy |
| **Media** | Görsel/video | kind (MediaKind), url, muxId, alt |
| **Subscriber** | Newsletter | email, verified, tags[] |
| **AuditLog** | Denetim | actorId, action, entity, meta |

### Para birimi konvansiyonu
Fiyatlar **minor unit** (kuruş) olarak `Int` tutulur (`priceMinor`, `totalMinor`, `unitMinor`). 750 TL = `75000`. Asla float kullanma.

### Enum'lar
- `Role`: SUPERADMIN, ADMIN, EDITOR, DOOR, VIEWER → [05-roles-permissions.md](05-roles-permissions.md)
- `EventStatus`: DRAFT, SCHEDULED, PUBLISHED, CANCELED, ARCHIVED → [03-logic-flows.md](03-logic-flows.md)
- `EventKind`: PARTY, CAMP, CONCERT, SHOWCASE
- `TicketStatus`: ACTIVE, PAUSED, SOLD_OUT, HIDDEN
- `OrderStatus`: PENDING, PAID, REFUNDED, FAILED, CANCELED → [03-logic-flows.md](03-logic-flows.md)
- `MediaKind`: POSTER, GALLERY, AFTERMOVIE, SET_REC, PRESS

## Eklenecek delta'lar (MVP için gerekli)

### 1. Category (YENİ) — keşfet filtreleri
```prisma
model Category {
  id        String  @id @default(cuid())
  slug      String  @unique
  name      String
  icon      String?
  color     String?
  position  Int     @default(0)
  events    Event[]
  createdAt DateTime @default(now())
}
// Event'e ekle:
//   categoryId String?
//   category   Category? @relation(fields: [categoryId], references: [id])
//   @@index([categoryId])
```
Seed (8 dikey — bkz. [00-product.md](00-product.md)): Wellness, Outdoor & Spor, Gezi & Seyahat, Workshop, Social, Food & Drink, Business & Networking, Nightlife.

### 1b. EventKind'e TRIP ekle
```prisma
enum EventKind {
  PARTY
  CAMP        // çok günlü, konaklamalı
  TRIP        // YENİ — günübirlik gezi/tur (tekne, gastronomi, şehir turu)
  CONCERT
  SHOWCASE
}
```
TRIP, CAMP'ten farkı: tek gün, konaklama yok; ama yine bilet + kontenjan + agenda mantığı aynı.

### 1c. Reservation (gece kulübü masa/alan — YENİ, basit)
Bilet değil; mevcut sitedeki "Rezervasyon". Bkz. [10-decisions.md](10-decisions.md) ADR-012.
```prisma
model Reservation {
  id        String   @id @default(cuid())
  eventId   String?  // bir gece etkinliğine bağlı olabilir (opsiyonel)
  venueId   String
  area      String   // "VIP" | "Lounge" | "Dance Floor" | "Rooftop" ...
  date      DateTime
  partySize Int
  fullName  String
  phone     String
  email     String
  note      String?
  status    String   @default("PENDING") // PENDING | CONFIRMED | CANCELED
  createdAt DateTime @default(now())
}
```
> MVP'de Reservation = talep formu + admin onayı (ödeme opsiyonel). Ana satış akışı bilet tarafı; Reservation faz 1 sonunda eklenebilir.

### 2. Event'e içerik alanları
```prisma
// Event modeline ekle:
agenda    Json?   // [{ time:"10:00", title:"Check-in" }, ...]
included  Json?   // ["Yoga matı","İçecek","Kahvaltı"]
bringList Json?   // ["Rahat kıyafet","Havlu"]
ageMin    Int?
```

### 3. User'a onboarding/iletişim alanları
```prisma
// User modeline ekle:
phone     String?
interests String[]   // ["yoga","camp","workshop"]
city      String?
birthDate DateTime?
```

### 4. Instructor (opsiyonel — wellness eğitmeni)
`Artist` modeli %90 örtüşüyor (name, bio, avatarUrl, instagram). **Karar:** MVP'de `Artist`'i yeniden adlandırmadan kullan; wellness eğitmenleri de `Artist` + `Lineup` ile bağlanır. Ayrı `Instructor` modeli faz 2. Bkz. [10-decisions.md](10-decisions.md) ADR-004.

### 5. Favorite (faz 2)
```prisma
model Favorite {
  userId  String
  eventId String
  createdAt DateTime @default(now())
  @@id([userId, eventId])
}
```

### 6. Community (faz 2 — MVP'de etiket olarak)
MVP'de topluluk = `Event` üzerinde `communityTag String?` + WhatsApp linki. Tam `Community` + `CommunityMember` modeli faz 3.

## Migration sırası
1. `Category` + `Event.categoryId` (+ seed)
2. `Event.agenda/included/bringList/ageMin`
3. `User.phone/interests/city/birthDate`
4. (faz 2) `Favorite`, `Community`
