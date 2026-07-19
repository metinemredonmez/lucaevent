-- Event: rezervasyon / gün-paketi yapılandırması (admin-managed JSON)
ALTER TABLE "Event" ADD COLUMN "reservation" JSONB;

-- Reservation: tipe özel ekstra alanlar (paket/meze/paddle) + email opsiyonel
ALTER TABLE "Reservation" ADD COLUMN "payload" JSONB;
ALTER TABLE "Reservation" ALTER COLUMN "email" DROP NOT NULL;
