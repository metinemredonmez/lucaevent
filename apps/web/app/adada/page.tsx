"use client";

import { useEffect, useMemo, useState } from "react";
import { Anchor, Check, Loader2, Sun, Waves, UtensilsCrossed } from "lucide-react";
import { Nav } from "@/components/nav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getEvent, createReservation, type ReservationConfig } from "@/lib/events";

// Luca Adada — gün-paketi rezervasyon formu.
// Paketler/menü "adada" etkinliğinin reservation config'inden gelir (admin-managed);
// etkinlik/config yoksa yerleşik varsayılanlar kullanılır. Gönderim → Reservation
// (eventId'li) → admin panelinde /admin/reservations altında görünür.

const SLUG = "adada";

type Paket = { id: string; name: string; alt?: string; price: number };
type Paddle = { id: string; name: string; price: number };
type Program = { time: string; desc: string };

const DEFAULT_PAKETLER: Paket[] = [
  { id: "plaj-aksam", name: "Plaj kullanımı + akşam yemeği", alt: "1 duble rakı dahil", price: 1750 },
  { id: "kahvalti", name: "Açık büfe kahvaltı + sınırsız çay", alt: "09.00 – 11.00", price: 750 },
];
const DEFAULT_MEZE = 300;
const DEFAULT_PADDLE: Paddle[] = [
  { id: "yok", name: "Katılmıyorum", price: 0 },
  { id: "tek", name: "Tek kişi binerse", price: 750 },
  { id: "cift", name: "İki kişi binerse (kişi başı)", price: 500 },
];
const DEFAULT_PROGRAM: Program[] = [
  { time: "09.00 – 11.00", desc: "Kahvaltı saati" },
  { time: "12.00 – 17.00", desc: "Paddle ve deniz" },
  { time: "17.00", desc: "Akşam yemeği başlangıç" },
];
const DEFAULT_NOTE = "Ekstra rakı, şarap, bira veya meşrubat isteyenler mekandan satın alarak temin edebilir.";

const tl = (n: number) => new Intl.NumberFormat("tr-TR").format(n) + "₺";

// "yok" (katılmıyorum) seçeneği her zaman ilk sırada olsun
function withYok(list: Paddle[]): Paddle[] {
  return list.some((p) => p.id === "yok") ? list : [{ id: "yok", name: "Katılmıyorum", price: 0 }, ...list];
}

export default function AdadaPage() {
  const bugun = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [cfg, setCfg] = useState<ReservationConfig | null>(null);
  const [eventId, setEventId] = useState<string | undefined>(undefined);

  const [paket, setPaket] = useState<string>("");
  const [kisi, setKisi] = useState(2);
  const [tarih, setTarih] = useState("");
  const [meze, setMeze] = useState(0);
  const [paddle, setPaddle] = useState<string>("yok");
  const [not, setNot] = useState("");
  const [ad, setAd] = useState("");
  const [tel, setTel] = useState("");
  const [kvkk, setKvkk] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // "adada" etkinliğinden config çek (varsa)
  useEffect(() => {
    getEvent(SLUG)
      .then((e) => {
        if (e?.id) setEventId(e.id);
        if (e?.reservation && (e.reservation.enabled ?? true)) setCfg(e.reservation);
      })
      .catch(() => {});
  }, []);

  const PAKETLER = cfg?.packages?.length ? cfg.packages : DEFAULT_PAKETLER;
  const MEZE_FIYAT = cfg?.mezePrice ?? DEFAULT_MEZE;
  const PADDLE = withYok(cfg?.paddle?.length ? cfg.paddle : DEFAULT_PADDLE);
  const PROGRAM = cfg?.program?.length ? cfg.program : DEFAULT_PROGRAM;
  const NOTE = cfg?.note?.trim() || DEFAULT_NOTE;
  const menuImg = cfg?.menuImageUrl || null;

  // Yaklaşık tutar (bilgi amaçlı — kesin fiyat onayında netleşir)
  const tahmin = useMemo(() => {
    const p = PAKETLER.find((x) => x.id === paket);
    const pd = PADDLE.find((x) => x.id === paddle);
    const paddleToplam = !pd ? 0 : pd.id === "cift" ? pd.price * kisi : pd.price;
    return (p ? p.price * kisi : 0) + meze * MEZE_FIYAT + paddleToplam;
  }, [paket, kisi, meze, paddle, PAKETLER, PADDLE, MEZE_FIYAT]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!paket) return setErr("Bir paket seç.");
    if (!tarih) return setErr("Tarih seç.");
    if (kisi < 1) return setErr("Kişi sayısı en az 1 olmalı.");
    if (!ad.trim()) return setErr("Adını yaz.");
    if (!tel.trim()) return setErr("Telefon numaranı yaz.");
    if (!kvkk) return setErr("Devam etmek için onay kutusunu işaretle.");

    const p = PAKETLER.find((x) => x.id === paket)!;
    const pd = PADDLE.find((x) => x.id === paddle)!;

    setLoading(true);
    try {
      await createReservation({
        eventId,
        area: p.name,
        date: new Date(tarih).toISOString(),
        partySize: kisi,
        fullName: ad.trim(),
        phone: tel.trim(),
        note: not.trim() || undefined,
        payload: {
          kind: "adada-rezervasyon",
          paketId: p.id,
          paketAd: p.name,
          paketFiyat: p.price,
          mezePorsiyon: meze,
          mezeFiyat: MEZE_FIYAT,
          paddle: pd.id,
          paddleAd: pd.name,
          yemekTercihi: not.trim() || null,
          tahminiTutar: tahmin,
        },
      });
      setDone(true);
    } catch (e: any) {
      setErr(e?.message || "Gönderilemedi, tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-background text-foreground">
        {/* başlık */}
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
            {menuImg && (
              <img
                src={menuImg}
                alt="Luca Adada menü"
                className="mx-auto mt-6 w-full max-w-md rounded-xl border border-border"
              />
            )}
          </div>
        </div>

        {done ? (
          <div className="mx-auto max-w-2xl px-5 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Check className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">Talebin alındı 🎉</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              En kısa sürede seni arayıp rezervasyonu netleştireceğiz. Teşekkürler!
            </p>
            <Button variant="outline" className="mt-6" onClick={() => setDone(false)}>
              Yeni talep oluştur
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mx-auto max-w-2xl px-5 py-10">
            {/* PAKET */}
            <fieldset className="space-y-3">
              <legend className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <Sun className="h-4 w-4 text-primary" /> Paket seç
              </legend>
              {PAKETLER.map((p) => {
                const on = paket === p.id;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPaket(p.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                      on ? "border-primary ring-2 ring-primary/40 bg-primary/5" : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <span>
                      <span className="block font-medium">{p.name}</span>
                      {p.alt && <span className="block text-xs text-muted-foreground">{p.alt}</span>}
                    </span>
                    <span className="shrink-0 rounded-lg bg-primary px-3 py-1.5 font-mono text-sm font-semibold text-primary-foreground">
                      {tl(p.price)}
                    </span>
                  </button>
                );
              })}
            </fieldset>

            {/* TARİH + KİŞİ */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Tarih</span>
                <Input type="date" min={bugun} value={tarih} onChange={(e) => setTarih(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Kişi sayısı</span>
                <Input type="number" min={1} max={50} value={kisi} onChange={(e) => setKisi(Math.max(1, Number(e.target.value) || 1))} />
              </label>
            </div>

            {/* MEZE */}
            <label className="mt-6 flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <span className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
                <span>
                  <span className="block font-medium">Meze porsiyonu</span>
                  <span className="block text-xs text-muted-foreground">{tl(MEZE_FIYAT)} / porsiyon · istersen ekle</span>
                </span>
              </span>
              <span className="flex items-center gap-3">
                <Button type="button" variant="outline" size="icon" onClick={() => setMeze((m) => Math.max(0, m - 1))}>−</Button>
                <span className="w-6 text-center font-mono font-semibold">{meze}</span>
                <Button type="button" variant="outline" size="icon" onClick={() => setMeze((m) => m + 1)}>+</Button>
              </span>
            </label>

            {/* PADDLE */}
            <fieldset className="mt-6 space-y-3">
              <legend className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <Waves className="h-4 w-4 text-primary" /> Paddle turu
              </legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {PADDLE.map((pd) => {
                  const on = paddle === pd.id;
                  return (
                    <button
                      type="button"
                      key={pd.id}
                      onClick={() => setPaddle(pd.id)}
                      className={`rounded-xl border p-3 text-left text-sm transition ${
                        on ? "border-primary ring-2 ring-primary/40 bg-primary/5" : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <span className="block font-medium">{pd.name}</span>
                      <span className="mt-1 block font-mono text-xs text-primary">{pd.price ? tl(pd.price) : "—"}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* YEMEK TERCİHİ / NOT */}
            <label className="mt-6 block">
              <span className="mb-1 block text-sm font-medium">Yemek tercihi / not</span>
              <textarea
                value={not}
                onChange={(e) => setNot(e.target.value)}
                rows={3}
                placeholder="Balık / et tercihi, alerji, vejetaryen, özel istek…"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>

            {/* İLETİŞİM */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Ad Soyad</span>
                <Input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Adın" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Telefon</span>
                <Input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="05xx xxx xx xx" inputMode="tel" />
              </label>
            </div>

            {/* TAHMİNİ TUTAR */}
            <div className="mt-6 flex items-center justify-between rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm">
              <span className="text-muted-foreground">Yaklaşık tutar</span>
              <span className="font-mono text-lg font-bold text-primary">{tl(tahmin)}</span>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">{NOTE}</p>

            {/* KVKK */}
            <label className="mt-5 flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" />
              <span>Talebimin iletilmesi için iletişim bilgilerimin işlenmesini onaylıyorum.</span>
            </label>

            {err && <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}

            <Button type="submit" disabled={loading} className="mt-5 w-full" size="lg">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Rezervasyon talebi gönder
            </Button>

            {/* GÜN BOYU PROGRAM */}
            <div className="mt-10 rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Anchor className="h-4 w-4 text-primary" /> Gün boyu program
              </div>
              <ul className="space-y-2">
                {PROGRAM.map((x, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-28 shrink-0 font-mono text-primary">{x.time}</span>
                    <span className="text-muted-foreground">{x.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </form>
        )}
      </main>
    </>
  );
}
