"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, CalendarDays, MapPin, Sparkles, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";

type Parsed = {
  title?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  venue?: string | null;
  categorySlug?: string | null;
  description?: string | null;
  priceText?: string | null;
  confidence?: number;
};
type Inbound = {
  id: string;
  waMessageId: string;
  groupName?: string | null;
  sender?: string | null;
  rawText: string;
  mediaUrls: string[];
  parsed?: Parsed | null;
  parseError?: string | null;
  status: string;
  eventId?: string | null;
  createdAt: string;
};

const STATUS: Record<string, { l: string; c: string }> = {
  NEW: { l: "Yeni", c: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  PARSED: { l: "Parse edildi", c: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  CONVERTED: { l: "Etkinliğe dönüştü", c: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  IGNORED: { l: "Yok sayıldı", c: "bg-muted text-muted-foreground" },
  FAILED: { l: "Parse hatası", c: "bg-destructive/15 text-destructive" },
};

const CATEGORIES = [
  { v: "", l: "— kategori seç —" },
  { v: "wellness", l: "Wellness" },
  { v: "outdoor-spor", l: "Outdoor & Spor" },
  { v: "gezi-seyahat", l: "Gezi & Seyahat" },
  { v: "workshop", l: "Workshop" },
  { v: "social", l: "Social" },
  { v: "food-drink", l: "Food & Drink" },
  { v: "business", l: "Business" },
  { v: "nightlife", l: "Nightlife" },
];

const FILTERS = [
  { v: "all", l: "Hepsi" },
  { v: "PARSED", l: "Onay bekleyen" },
  { v: "NEW", l: "Yeni" },
  { v: "CONVERTED", l: "Dönüştü" },
  { v: "IGNORED", l: "Yok sayıldı" },
  { v: "FAILED", l: "Hata" },
];

// ISO → <input type=datetime-local> değeri (yerel saat, dakika hassasiyeti).
function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function WhatsappAdmin() {
  const router = useRouter();
  const [rows, setRows] = useState<Inbound[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PARSED");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  // düzenlenen parse alanları (id → Parsed)
  const [edits, setEdits] = useState<Record<string, Parsed>>({});

  function load() {
    setLoading(true);
    api<Inbound[]>("/admin/whatsapp")
      .then((r) => {
        setRows(r);
        const e: Record<string, Parsed> = {};
        r.forEach((row) => (e[row.id] = { ...(row.parsed ?? {}) }));
        setEdits(e);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function setField(id: string, k: keyof Parsed, v: string) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [k]: v } }));
  }

  async function save(id: string, extra?: Partial<Inbound>) {
    const p = edits[id] ?? {};
    const parsed: Parsed = {
      ...p,
      startsAt: p.startsAt ? new Date(p.startsAt).toISOString() : null,
      endsAt: p.endsAt ? new Date(p.endsAt).toISOString() : null,
    };
    await api(`/admin/whatsapp/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ parsed, ...extra }),
    });
  }

  async function convert(id: string) {
    setBusy(id);
    setErr("");
    try {
      await save(id); // önce düzeltmeleri kaydet
      const ev = await api<{ id: string }>(`/admin/whatsapp/${id}/convert`, { method: "POST" });
      router.push(`/admin/events/${ev.id}`); // kapak / bilet için event formuna götür
    } catch (e: any) {
      setErr(e.message);
      setBusy("");
    }
  }

  async function setStatus(id: string, status: string) {
    setBusy(id);
    try {
      await api(`/admin/whatsapp/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  const stats = useMemo(() => {
    const by = (s: string) => rows.filter((r) => r.status === s).length;
    return { total: rows.length, pending: by("PARSED") + by("NEW"), converted: by("CONVERTED") };
  }, [rows]);

  const list = useMemo(
    () => rows.filter((r) => filter === "all" || r.status === filter),
    [rows, filter],
  );

  return (
    <div>
      <AdminPageHeader
        title="WhatsApp Etkinlikleri"
        subtitle="Gruptan gelen mesajlar parse edilir; onaylarsan DRAFT etkinliğe dönüşür."
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { l: "Toplam", v: stats.total, c: "text-foreground" },
          { l: "Onay bekleyen", v: stats.pending, c: "text-amber-600 dark:text-amber-400" },
          { l: "Dönüştü", v: stats.converted, c: "text-emerald-600 dark:text-emerald-400" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card px-4 py-3">
            <div className={`text-2xl font-semibold tabular-nums ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`rounded-full px-3 py-1 text-xs transition ${
              filter === f.v ? "bg-primary text-white" : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}

      {loading ? (
        <div className="rounded-xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          Yükleniyor…
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          <MessageCircle className="mx-auto mb-2 h-6 w-6 opacity-40" />
          {rows.length === 0 ? "Henüz WhatsApp mesajı gelmedi." : "Bu filtreyle kayıt yok."}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((r) => {
            const st = STATUS[r.status] ?? { l: r.status, c: "bg-muted text-muted-foreground" };
            const e = edits[r.id] ?? {};
            const conf = r.parsed?.confidence;
            const done = r.status === "CONVERTED" || r.status === "IGNORED";
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${st.c}`}>{st.l}</span>
                  {r.groupName && <span>· {r.groupName}</span>}
                  {r.sender && <span>· {r.sender}</span>}
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> {formatDateTR(r.createdAt)}
                  </span>
                  {typeof conf === "number" && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[10px]">
                      <Sparkles className="h-3 w-3" /> güven %{Math.round(conf * 100)}
                    </span>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* ham mesaj + medya */}
                  <div>
                    <div className="mb-1 text-[11px] font-medium uppercase text-muted-foreground">Ham mesaj</div>
                    <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground/80">
                      {r.rawText}
                    </div>
                    {r.parseError && <p className="mt-1 text-xs text-destructive">Parse hatası: {r.parseError}</p>}
                    {r.mediaUrls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.mediaUrls.map((u) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={u} src={u} alt="" className="h-16 w-16 rounded-md object-cover" />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* parse edilmiş alanlar (düzenlenebilir) */}
                  <div className="space-y-2">
                    <div className="mb-1 text-[11px] font-medium uppercase text-muted-foreground">Etkinlik önizleme</div>
                    <input
                      value={e.title ?? ""}
                      onChange={(ev) => setField(r.id, "title", ev.target.value)}
                      placeholder="Başlık"
                      disabled={done}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary/50 disabled:opacity-60"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="datetime-local"
                        value={toLocalInput(e.startsAt)}
                        onChange={(ev) => setField(r.id, "startsAt", ev.target.value)}
                        disabled={done}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 disabled:opacity-60"
                      />
                      <select
                        value={e.categorySlug ?? ""}
                        onChange={(ev) => setField(r.id, "categorySlug", ev.target.value)}
                        disabled={done}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 disabled:opacity-60"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.v} value={c.v}>{c.l}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={e.venue ?? ""}
                        onChange={(ev) => setField(r.id, "venue", ev.target.value)}
                        placeholder="Mekan / konum"
                        disabled={done}
                        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50 disabled:opacity-60"
                      />
                    </div>
                    <textarea
                      value={e.description ?? ""}
                      onChange={(ev) => setField(r.id, "description", ev.target.value)}
                      placeholder="Açıklama"
                      rows={2}
                      disabled={done}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* aksiyonlar */}
                {done ? (
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    {r.eventId && (
                      <a href={`/admin/events/${r.eventId}`} className="text-primary hover:underline">
                        → Etkinliği düzenle
                      </a>
                    )}
                    <span className="text-xs text-muted-foreground">{st.l}</span>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      disabled={busy === r.id}
                      onClick={() => convert(r.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" /> Etkinlik oluştur (DRAFT)
                    </button>
                    <button
                      disabled={busy === r.id}
                      onClick={() => save(r.id).then(load).catch((x) => setErr(x.message))}
                      className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                    >
                      Kaydet
                    </button>
                    <button
                      disabled={busy === r.id}
                      onClick={() => setStatus(r.id, "IGNORED")}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-destructive disabled:opacity-50"
                    >
                      <X className="h-4 w-4" /> Yok say
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
