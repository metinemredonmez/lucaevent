"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { MediaUpload } from "@/components/admin/media-upload";

const KINDS = [
  { v: "PARTY", l: "Parti / Gece" },
  { v: "CAMP", l: "Kamp / Festival (konaklamalı)" },
  { v: "TRIP", l: "Gezi / Tur (tek gün)" },
  { v: "CONCERT", l: "Konser" },
  { v: "SHOWCASE", l: "Showcase" },
];
const STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED", "CANCELED", "ARCHIVED"];

type Cat = { id: string; name: string; slug: string };
type Mode = "create" | "edit";

const FIELD =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#22c9b8]/40 focus:border-[#22c9b8]/50";
const LABEL = "block text-xs font-medium text-muted-foreground mb-1";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function toInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function toISO(input: string): string | undefined {
  return input ? new Date(input).toISOString() : undefined;
}
function lines(s: string): string[] | undefined {
  const arr = s.split("\n").map((x) => x.trim()).filter(Boolean);
  return arr.length ? arr : undefined;
}

export function EventForm({ mode, id, initial }: { mode: Mode; id?: string; initial?: any }) {
  const router = useRouter();
  const [cats, setCats] = useState<Cat[]>([]);
  const [adv, setAdv] = useState(false);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [f, setF] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    kind: initial?.kind ?? "PARTY",
    categoryId: initial?.categoryId ?? initial?.category?.id ?? "",
    tagline: initial?.tagline ?? "",
    description: initial?.description ?? "",
    coverUrl: initial?.coverUrl ?? "",
    startsAt: toInput(initial?.startsAt),
    endsAt: toInput(initial?.endsAt),
    doorsAt: toInput(initial?.doorsAt),
    ageMin: initial?.ageMin ?? "",
    included: (initial?.included ?? []).join("\n"),
    bringList: (initial?.bringList ?? []).join("\n"),
    travelInfo: initial?.travelInfo ?? "",
    musicLabel: (initial as { musicLabel?: string })?.musicLabel ?? "",
    musicQuery: (initial as { musicQuery?: string })?.musicQuery ?? "",
    campingAllowed: initial?.campingAllowed ?? false,
    status: initial?.status ?? "DRAFT",
    // canlı yayın
    liveStatus: initial?.liveStatus ?? "OFFLINE",
    streamUrl: initial?.streamUrl ?? "",
    streamAccess: initial?.streamAccess ?? "PUBLIC",
    streamPrice: initial?.streamPriceMinor != null ? String(initial.streamPriceMinor / 100) : "",
  });

  useEffect(() => {
    api<Cat[]>("/categories").then(setCats).catch(() => {});
  }, []);

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((s) => ({ ...s, [k]: v }));
  }
  function onTitle(v: string) {
    setF((s) => ({ ...s, title: v, slug: slugTouched ? s.slug : slugify(v) }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!f.title.trim()) return setErr("Başlık zorunlu.");
    if (!f.slug.trim()) return setErr("Slug zorunlu.");
    if (!f.startsAt) return setErr("Başlangıç tarihi zorunlu.");

    const body: Record<string, unknown> = {
      title: f.title.trim(),
      slug: f.slug.trim(),
      kind: f.kind,
      startsAt: toISO(f.startsAt),
      endsAt: toISO(f.endsAt),
      doorsAt: toISO(f.doorsAt),
      tagline: f.tagline || undefined,
      description: f.description || undefined,
      coverUrl: f.coverUrl || undefined,
      categoryId: f.categoryId || undefined,
      travelInfo: f.travelInfo || undefined,
      musicLabel: f.musicLabel || undefined,
      musicQuery: f.musicQuery || undefined,
      campingAllowed: f.campingAllowed || undefined,
      ageMin: f.ageMin !== "" ? Number(f.ageMin) : undefined,
      included: lines(f.included),
      bringList: lines(f.bringList),
    };
    if (mode === "edit") {
      body.status = f.status;
      body.liveStatus = f.liveStatus;
      body.streamUrl = f.streamUrl.trim() || undefined;
      body.streamAccess = f.streamAccess;
      if (f.streamPrice !== "" && !Number.isNaN(Number(f.streamPrice))) {
        body.streamPriceMinor = Math.round(Number(f.streamPrice) * 100);
      }
    }

    setSaving(true);
    try {
      if (mode === "create") {
        await api("/admin/events", { method: "POST", body: JSON.stringify(body) });
      } else {
        await api(`/admin/events/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      }
      router.push("/admin/events");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      {/* Temel */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <label className={LABEL}>Başlık *</label>
          <input className={FIELD} value={f.title} onChange={(e) => onTitle(e.target.value)} placeholder="Sunset Yoga & Ses Banyosu" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Slug *</label>
            <input
              className={FIELD}
              value={f.slug}
              onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
              placeholder="sunset-yoga-ses-banyosu"
            />
          </div>
          <div>
            <label className={LABEL}>Tür *</label>
            <select className={FIELD} value={f.kind} onChange={(e) => set("kind", e.target.value)}>
              {KINDS.map((k) => <option key={k.v} value={k.v}>{k.l}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={LABEL}>Kategori</label>
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => {
              const on = f.categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => set("categoryId", on ? "" : c.id)}
                  className="rounded-full border px-3 py-1.5 text-xs transition-all hover:border-[#22c9b8]/60 active:scale-95"
                  style={{
                    borderColor: on ? "#22c9b8" : "#E3DED5",
                    background: on ? "rgba(34,201,184,0.12)" : "#fff",
                    color: on ? "#0a6f65" : "#6F6F6F",
                  }}
                >
                  {c.name}
                </button>
              );
            })}
            {cats.length === 0 && <span className="text-xs text-muted-foreground/60">kategoriler yükleniyor…</span>}
          </div>
        </div>
        <div>
          <label className={LABEL}>Kapak görseli</label>
          <input className={FIELD} value={f.coverUrl} onChange={(e) => set("coverUrl", e.target.value)} placeholder="/img/events/slug.jpg  ·  ya da yükle →" />
          <div className="mt-2">
            <MediaUpload kind="image" folder="events" value={f.coverUrl} onChange={(url) => set("coverUrl", url)} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Kısa açıklama (tagline)</label>
          <input className={FIELD} value={f.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Gün batımında nefes ve hareket" />
        </div>
        <div>
          <label className={LABEL}>Açıklama</label>
          <textarea className={FIELD} rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} />
        </div>
      </div>

      {/* Tarih & saat */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Başlangıç *</label>
            <input type="datetime-local" className={FIELD} value={f.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Bitiş</label>
            <input type="datetime-local" className={FIELD} value={f.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Gelişmiş */}
      <div className="rounded-xl border border-border bg-card">
        <button type="button" onClick={() => setAdv((a) => !a)} className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-foreground">
          Gelişmiş alanlar
          <span className="text-muted-foreground">{adv ? "−" : "+"}</span>
        </button>
        {adv && (
          <div className="space-y-4 border-t border-border p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Kapı açılış</label>
                <input type="datetime-local" className={FIELD} value={f.doorsAt} onChange={(e) => set("doorsAt", e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Minimum yaş</label>
                <input type="number" min={0} className={FIELD} value={f.ageMin} onChange={(e) => set("ageMin", e.target.value)} placeholder="18" />
              </div>
            </div>
            <div>
              <label className={LABEL}>Dahil olanlar (her satır bir madde)</label>
              <textarea className={FIELD} rows={3} value={f.included} onChange={(e) => set("included", e.target.value)} placeholder={"Mat\nÇay & ikram\nEğitmen"} />
            </div>
            <div>
              <label className={LABEL}>Yanında getir (her satır bir madde)</label>
              <textarea className={FIELD} rows={3} value={f.bringList} onChange={(e) => set("bringList", e.target.value)} placeholder={"Rahat kıyafet\nSu"} />
            </div>
            <div>
              <label className={LABEL}>Ulaşım / seyahat bilgisi</label>
              <textarea className={FIELD} rows={2} value={f.travelInfo} onChange={(e) => set("travelInfo", e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Radyo müziği — etiket</label>
                <input className={FIELD} value={f.musicLabel} onChange={(e) => set("musicLabel", e.target.value)} placeholder="İtalyan Akşamı" />
              </div>
              <div>
                <label className={LABEL}>Radyo müziği — tür/sorgu</label>
                <input className={FIELD} value={f.musicQuery} onChange={(e) => set("musicQuery", e.target.value)} placeholder="italian · boşsa kategoriye göre" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" className="h-4 w-4 accent-[#22c9b8]" checked={f.campingAllowed} onChange={(e) => set("campingAllowed", e.target.checked)} />
              Konaklama / kamp var
            </label>
          </div>
        )}
      </div>

      {/* Canlı Yayın (edit) */}
      {mode === "edit" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className={`inline-block h-2 w-2 rounded-full ${f.liveStatus === "LIVE" ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
            Canlı Yayın
            {f.liveStatus === "LIVE" && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">YAYINDA</span>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Durum</label>
              <select className={FIELD} value={f.liveStatus} onChange={(e) => set("liveStatus", e.target.value)}>
                <option value="OFFLINE">Çevrimdışı</option>
                <option value="LIVE">Canlı (yayında)</option>
                <option value="ENDED">Bitti</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Erişim</label>
              <select className={FIELD} value={f.streamAccess} onChange={(e) => set("streamAccess", e.target.value)}>
                <option value="PUBLIC">Herkese açık</option>
                <option value="MEMBERS">Sadece üyeler</option>
                <option value="PAID">Ücretli (bilet/ödeme)</option>
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL}>Yayın kaynağı</label>
            <div className="mb-2">
              <MediaUpload
                kind="video"
                folder="videos"
                onChange={(url) => set("streamUrl", url)}
                buttonLabel="Video yükle (R2 · mp4)"
              />
            </div>
            <input
              className={FIELD}
              value={f.streamUrl}
              onChange={(e) => set("streamUrl", e.target.value)}
              placeholder="…ya da URL yapıştır: https://… .m3u8  ·  youtube.com/watch?v=…"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Dosya yükle (R2'ye kaydolur, mp4 olarak oynar) ya da URL yapıştır. YouTube Live/video ve HLS (.m3u8) oynatılır; Instagram gömülemez (yalnız link kalır).
            </p>
          </div>
          {f.streamAccess === "PAID" && (
            <div className="sm:w-56">
              <label className={LABEL}>İzleme ücreti (₺)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className={FIELD}
                value={f.streamPrice}
                onChange={(e) => set("streamPrice", e.target.value)}
                placeholder="49.90"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Üyeler bu etkinliğe bilet/ödeme yapınca izleyebilir.</p>
            </div>
          )}
          {f.streamUrl && (
            <a
              href={`/canli/${f.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              İzleme sayfasını aç → /canli/{f.slug}
            </a>
          )}
        </div>
      )}

      {/* Durum (edit) */}
      {mode === "edit" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <label className={LABEL}>Etkinlik durumu</label>
          <select className={FIELD + " sm:w-56"} value={f.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {err && <p className="text-sm text-destructive">{err}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gradient-to-r from-[#0e9a8c] to-[#22c9b8] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Kaydediliyor…" : mode === "create" ? "Etkinliği oluştur" : "Değişiklikleri kaydet"}
        </button>
        <Link href="/admin/events" className="text-sm text-muted-foreground hover:text-foreground">
          Vazgeç
        </Link>
        {mode === "create" && (
          <span className="ml-auto text-xs text-muted-foreground">Oluşturunca taslak (DRAFT) olur — listede “Yayınla” ile yayınla.</span>
        )}
      </div>
    </form>
  );
}
