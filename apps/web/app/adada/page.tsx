"use client";

import { useEffect, useState } from "react";
import { Anchor } from "lucide-react";
import { Nav } from "@/components/nav";
import { ReservationForm } from "@/components/reservation-form";
import { getEvent, type ReservationConfig } from "@/lib/events";

// /adada — "adada" etkinliğinin rezervasyon formu (kısayol). Asıl form etkinlik detay
// sayfasında da (/etkinlik/adada) gösterilir; burası doğrudan paylaşılabilir link.
const SLUG = "adada";

export default function AdadaPage() {
  const [cfg, setCfg] = useState<ReservationConfig | null>(null);
  const [eventId, setEventId] = useState<string | undefined>(undefined);

  useEffect(() => {
    getEvent(SLUG)
      .then((e) => {
        if (e?.id) setEventId(e.id);
        if (e?.reservation) setCfg(e.reservation);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-background text-foreground">
        <div className="border-b border-border">
          <div className="mx-auto max-w-2xl px-5 py-10 text-center">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Anchor className="h-4 w-4" />
              <span className="font-mono text-xs uppercase tracking-[0.3em]">Luca · Adada</span>
            </div>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Adada Rezervasyon</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Paketini seç, birkaç soruyu yanıtla — talebin bize ulaşsın, onaylayıp seni arayalım.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-5 py-10">
          <ReservationForm eventId={eventId} config={cfg} />
        </div>
      </main>
    </>
  );
}
