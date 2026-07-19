"use client";

import { useMemo, useState } from "react";
import { Anchor, Check, Loader2, Sun, Waves, UtensilsCrossed } from "lucide-react";
import { Nav } from "@/components/nav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSubmission, type SubmissionBody } from "@/lib/session";

// Luca Adada — gün-paketi rezervasyon formu.
// WhatsApp'ta paylaşılan link → bu sayfa → kısa soru-cevap → admin paneline "İletişim"
// başvurusu olarak düşer (konu: "Adada Rezervasyon"). Fulya panelden görüp onaylar.

type PaketId = "plaj-aksam" | "kahvalti";
const PAKETLER: { id: PaketId; ad: string; alt: string; fiyat: number }[] = [
  { id: "plaj-aksam", ad: "Plaj kullanımı + akşam yemeği", alt: "1 duble rakı dahil", fiyat: 1750 },
  { id: "kahvalti", ad: "Açık büfe kahvaltı + sınırsız çay", alt: "09.00 – 11.00", fiyat: 750 },
];
const MEZE_FIYAT = 300;

type PaddleId = "yok" | "tek" | "cift";
const PADDLE: { id: PaddleId; ad: string; fiyat: number }[] = [
  { id: "yok", ad: "Katılmıyorum", fiyat: 0 },
  { id: "tek", ad: "Tek kişi binerse", fiyat: 750 },
  { id: "cift", ad: "İki kişi binerse (kişi başı)", fiyat: 500 },
];

const PROGRAM = [
  { t: "09.00 – 11.00", d: "Kahvaltı saati" },
  { t: "12.00 – 17.00", d: "Paddle ve deniz" },
  { t: "17.00", d: "Akşam yemeği başlangıç" },
];

const tl = (n: number) => new Intl.NumberFormat("tr-TR").format(n) + "₺";

export default function AdadaPage() {
  const bugun = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [paket, setPaket] = useState<PaketId | "">("");
  const [kisi, setKisi] = useState(2);
  const [tarih, setTarih] = useState("");
  const [meze, setMeze] = useState(0);
  const [paddle, setPaddle] = useState<PaddleId>("yok");
  const [not, setNot] = useState("");
  const [ad, setAd] = useState("");
  const [tel, setTel] = useState("");
  const [kvkk, setKvkk] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Yaklaşık tutar (bilgi amaçlı — kesin fiyat Fulya onayında netleşir)
  const tahmin = useMemo(() => {
    const p = PAKETLER.find((x) => x.id === paket);
    const pd = PADDLE.find((x) => x.id === paddle)!;
    const paddleToplam = paddle === "tek" ? 750 : paddle === "cift" ? 500 * kisi : 0;
    return (p ? p.fiyat * kisi : 0) + meze * MEZE_FIYAT + paddleToplam;
  }, [paket, kisi, meze, paddle]);

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
    const tarihStr = new Date(tarih).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

    const ozet = [
      `🏖️ Luca Adada rezervasyon talebi`,
      `Tarih: ${tarihStr}`,
      `Kişi: ${kisi}`,
      `Paket: ${p.ad} (${tl(p.fiyat)}/kişi)`,
      meze > 0 ? `Meze: ${meze} porsiyon (${tl(MEZE_FIYAT)}/porsiyon)` : `Meze: —`,
      `Paddle turu: ${pd.ad}${pd.fiyat ? ` (${tl(pd.fiyat)})` : ""}`,
      not.trim() ? `Yemek tercihi / not: ${not.trim()}` : null,
      `Yaklaşık tutar: ${tl(tahmin)}`,
      `İletişim: ${ad.trim()} · ${tel.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");

    const body: SubmissionBody = {
      type: "CONTACT",
      name: ad.trim(),
      phone: tel.trim(),
      subject: `Adada Rezervasyon — ${tarihStr} · ${kisi} kişi`,
      message: ozet,
      payload: {
        kind: "adada-rezervasyon",
        tarih,
        kisi,
        paket: p.id,
        paketAd: p.ad,
        paketFiyat: p.fiyat,
        mezePorsiyon: meze,
        paddle: pd.id,
        paddleAd: pd.ad,
        yemekTercihi: not.trim() || null,
        tahminiTutar: tahmin,
      },
    };

    setLoading(true);
    try {
      await createSubmission(body);
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
            <Button variant="outline" className="mt-6" onClick={() => { setDone(false); }}>
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
                      <span className="block font-medium">{p.ad}</span>
                      <span className="block text-xs text-muted-foreground">{p.alt}</span>
                    </span>
                    <span className="shrink-0 rounded-lg bg-primary px-3 py-1.5 font-mono text-sm font-semibold text-primary-foreground">
                      {tl(p.fiyat)}
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
                      <span className="block font-medium">{pd.ad}</span>
                      <span className="mt-1 block font-mono text-xs text-primary">{pd.fiyat ? tl(pd.fiyat) : "—"}</span>
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
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Ekstra rakı, şarap, bira veya meşrubat isteyenler mekandan satın alarak temin edebilir.
            </p>

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

            {/* GÜN BOYU PROGRAM — bilgi */}
            <div className="mt-10 rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Anchor className="h-4 w-4 text-primary" /> Gün boyu program
              </div>
              <ul className="space-y-2">
                {PROGRAM.map((x) => (
                  <li key={x.t} className="flex gap-3 text-sm">
                    <span className="w-28 shrink-0 font-mono text-primary">{x.t}</span>
                    <span className="text-muted-foreground">{x.d}</span>
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
