import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  DoorOpen,
  Users,
  ListChecks,
  Backpack,
  CalendarPlus,
} from "lucide-react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/sections/footer";
import { ReservationForm } from "@/components/reservation-form";
import { getEvent, eventIcsUrl } from "@/lib/events";
import { formatDateTR } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ev = await getEvent(slug);
  return {
    title: ev ? `${ev.title} · Luca` : "Etkinlik · Luca",
    description: ev?.tagline ?? ev?.description?.slice(0, 140) ?? undefined,
  };
}

function timeTR(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ev = await getEvent(slug);
  if (!ev) notFound();

  const past = new Date(ev.startsAt).getTime() < Date.now();
  const agenda = Array.isArray(ev.agenda) ? ev.agenda : [];
  const included = ev.included ?? [];
  const bringList = ev.bringList ?? [];

  return (
    <>
      <Nav />
      <main className="pt-24 md:pt-28 pb-20">
        <div className="container max-w-4xl">
          <Link
            href="/kesfet"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Keşfet
          </Link>

          {/* kapak */}
          <div className="relative mt-5 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-muted">
            {ev.coverUrl ? (
              <Image
                src={ev.coverUrl}
                alt={ev.title}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0e9a8c] via-[#0e9a8c] to-[#22c9b8]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute left-4 top-4 flex items-center gap-2">
              {ev.category && (
                <span className="rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur-md">
                  {ev.category.name}
                </span>
              )}
              {past && (
                <span className="rounded-full bg-black/40 px-3 py-1 text-xs text-white/80 backdrop-blur-md">
                  Geçmiş etkinlik
                </span>
              )}
            </div>
          </div>

          {/* başlık */}
          <h1 className="mt-6 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
            {ev.title}
          </h1>
          {ev.tagline && <p className="mt-2 text-lg text-muted-foreground">{ev.tagline}</p>}

          {/* meta */}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2 text-foreground">
              <CalendarDays className="size-4 text-primary" /> {formatDateTR(ev.startsAt)}
            </span>
            <span className="inline-flex items-center gap-2 text-foreground">
              <Clock className="size-4 text-primary" />
              {timeTR(ev.startsAt)}
              {ev.endsAt ? ` – ${timeTR(ev.endsAt)}` : ""}
            </span>
            {ev.venue?.name && (
              <span className="inline-flex items-center gap-2 text-foreground">
                <MapPin className="size-4 text-primary" /> {ev.venue.name}
                {ev.venue.city ? `, ${ev.venue.city}` : ""}
              </span>
            )}
            {ev.doorsAt && (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <DoorOpen className="size-4" /> Kapı: {timeTR(ev.doorsAt)}
              </span>
            )}
            {ev.ageMin != null && ev.ageMin > 0 && (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" /> {ev.ageMin}+
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="mt-6 flex flex-wrap gap-3">
            {!past && (
              <Link
                href={ev.reservation?.enabled ? "#rezervasyon" : "/basvuru"}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0e9a8c] to-[#22c9b8] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
              >
                {ev.reservation?.enabled ? "Rezervasyon yap" : "Katıl / Bilgi al"}
              </Link>
            )}
            <a
              href={eventIcsUrl(ev.slug)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-foreground transition hover:border-primary/50"
            >
              <CalendarPlus className="size-4" /> Takvime ekle
            </a>
          </div>

          {/* açıklama */}
          {ev.description && (
            <p className="mt-8 whitespace-pre-line leading-relaxed text-muted-foreground">
              {ev.description}
            </p>
          )}

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {/* program */}
            {agenda.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Clock className="size-4 text-primary" /> Program
                </div>
                <ul className="space-y-2">
                  {agenda.map((a, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-12 shrink-0 font-mono tabular-nums text-primary">{a.time}</span>
                      <span className="text-foreground">{a.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* dahil olanlar */}
            {included.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <ListChecks className="size-4 text-primary" /> Dahil olanlar
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {included.map((x, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span> {x}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* yanında getir */}
            {bringList.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Backpack className="size-4 text-primary" /> Yanında getir
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {bringList.map((x, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span> {x}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* konum */}
            {ev.venue?.address && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <MapPin className="size-4 text-primary" /> Konum
                </div>
                <div className="text-sm text-foreground">{ev.venue.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{ev.venue.address}</div>
                {ev.venue.lat != null && ev.venue.lng != null && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${ev.venue.lat},${ev.venue.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-primary hover:underline"
                  >
                    Haritada aç →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* rezervasyon formu */}
          {ev.reservation?.enabled && !past && (
            <section id="rezervasyon" className="mt-12 scroll-mt-28">
              <h2 className="font-serif text-2xl font-semibold tracking-tight">Rezervasyon</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Paketini seç, birkaç soruyu yanıtla — talebini alalım, seni arayıp netleştirelim.
              </p>
              <div className="mt-5">
                <ReservationForm eventId={ev.id} config={ev.reservation} />
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
