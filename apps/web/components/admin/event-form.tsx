"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

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
  "w-full rounded-md border border-[#E3DED5] bg-white px-3 py-2 text-sm text-[#171717] placeholder:text-[#B7B0A4] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40 focus:border-[#8B5CF6]/50";
const LABEL = "block text-xs font-medium text-[#6F6F6F] mb-1";

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
    campingAllowed: initial?.campingAllowed ?? false,
    status: initial?.status ?? "DRAFT",
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
      campingAllowed: f.campingAllowed || undefined,
      ageMin: f.ageMin !== "" ? Number(f.ageMin) : undefined,
      included: lines(f.included),
      bringList: lines(f.bringList),
    };
    if (mode === "edit") body.status = f.status;

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
      <div className="rounded-xl border border-[#E3DED5] bg-white p-5 space-y-4">
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
                  className="rounded-full border px-3 py-1.5 text-xs transition-all hover:border-[#8B5CF6]/60 active:scale-95"
                  style={{
                    borderColor: on ? "#8B5CF6" : "#E3DED5",
                    background: on ? "rgba(139,92,246,0.12)" : "#fff",
                    color: on ? "#6D28D9" : "#6F6F6F",
                  }}
                >
                  {c.name}
                </button>
              );
            })}
            {cats.length === 0 && <span className="text-xs text-[#B7B0A4]">kategoriler yükleniyor…</span>}
          </div>
        </div>
        <div>
          <label className={LABEL}>Kapak görseli (URL/yol)</label>
          <input className={FIELD} value={f.coverUrl} onChange={(e) => set("coverUrl", e.target.value)} placeholder="/img/events/slug.jpg" />
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
      <div className="rounded-xl border border-[#E3DED5] bg-white p-5">
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
      <div className="rounded-xl border border-[#E3DED5] bg-white">
        <button type="button" onClick={() => setAdv((a) => !a)} className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-[#171717]">
          Gelişmiş alanlar
          <span className="text-[#6F6F6F]">{adv ? "−" : "+"}</span>
        </button>
        {adv && (
          <div className="space-y-4 border-t border-[#E3DED5] p-5">
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
            <label className="flex items-center gap-2 text-sm text-[#171717]">
              <input type="checkbox" className="h-4 w-4 accent-[#8B5CF6]" checked={f.campingAllowed} onChange={(e) => set("campingAllowed", e.target.checked)} />
              Konaklama / kamp var
            </label>
          </div>
        )}
      </div>

      {/* Durum (edit) */}
      {mode === "edit" && (
        <div className="rounded-xl border border-[#E3DED5] bg-white p-5">
          <label className={LABEL}>Durum</label>
          <select className={FIELD + " sm:w-56"} value={f.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {err && <p className="text-sm text-[#A23E48]">{err}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Kaydediliyor…" : mode === "create" ? "Etkinliği oluştur" : "Değişiklikleri kaydet"}
        </button>
        <Link href="/admin/events" className="text-sm text-[#6F6F6F] hover:text-[#171717]">
          Vazgeç
        </Link>
        {mode === "create" && (
          <span className="ml-auto text-xs text-[#6F6F6F]">Oluşturunca taslak (DRAFT) olur — listede “Yayınla” ile yayınla.</span>
        )}
      </div>
    </form>
  );
}
