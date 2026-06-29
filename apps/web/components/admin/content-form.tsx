"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type Kind = "post" | "page";
type Mode = "create" | "edit";

const FIELD =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40 focus:border-[#8B5CF6]/50";
const LABEL = "block text-xs font-medium text-muted-foreground mb-1";

const POST_STATUSES = [
  { v: "DRAFT", l: "Taslak" },
  { v: "PUBLISHED", l: "Yayında" },
  { v: "ARCHIVED", l: "Arşiv" },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ContentForm({
  kind,
  mode,
  id,
  initial,
}: {
  kind: Kind;
  mode: Mode;
  id?: string;
  initial?: any;
}) {
  const router = useRouter();
  const base = kind === "post" ? "/admin/posts" : "/admin/pages";
  const backHref = base;
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [f, setF] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    excerpt: initial?.excerpt ?? "",
    coverUrl: initial?.coverUrl ?? "",
    content: initial?.content ?? "",
    status: initial?.status ?? "DRAFT",
    isPublished: initial?.isPublished ?? true,
  });

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
    if (!f.content.trim()) return setErr("İçerik zorunlu.");

    const body: Record<string, unknown> = {
      title: f.title.trim(),
      slug: f.slug.trim() || undefined,
      excerpt: f.excerpt.trim() || undefined,
      content: f.content,
    };
    if (kind === "post") {
      body.coverUrl = f.coverUrl.trim() || undefined;
      body.status = f.status;
    } else {
      body.isPublished = f.isPublished;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        await api(base, { method: "POST", body: JSON.stringify(body) });
      } else {
        await api(`${base}/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      }
      router.push(backHref);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div>
          <label className={LABEL}>Başlık *</label>
          <input
            className={FIELD}
            value={f.title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder={kind === "post" ? "Hafta sonu için 5 fikir" : "Hakkımızda"}
          />
        </div>
        <div>
          <label className={LABEL}>Slug (URL)</label>
          <input
            className={FIELD}
            value={f.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value);
            }}
            placeholder="otomatik"
          />
          <p className="mt-1 text-xs text-muted-foreground/60">
            {kind === "post" ? `/blog/${f.slug || "..."}` : `/sayfa/${f.slug || "..."}`}
          </p>
        </div>
        <div>
          <label className={LABEL}>Kısa özet</label>
          <input
            className={FIELD}
            value={f.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            placeholder="Listede ve önizlemede görünür"
          />
        </div>
        {kind === "post" && (
          <div>
            <label className={LABEL}>Kapak görseli (URL/yol)</label>
            <input
              className={FIELD}
              value={f.coverUrl}
              onChange={(e) => set("coverUrl", e.target.value)}
              placeholder="/img/events/slug.jpg"
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <label className={LABEL}>İçerik (markdown) *</label>
        <textarea
          className={FIELD + " min-h-[280px] font-mono text-[13px] leading-relaxed"}
          value={f.content}
          onChange={(e) => set("content", e.target.value)}
          placeholder={"## Başlık\n\nParagraf metni.\n\n- Madde 1\n- Madde 2"}
        />
        <p className="mt-2 text-xs text-muted-foreground/60">
          Desteklenen: <code>## Başlık</code>, <code>### Alt başlık</code>, <code>- liste</code>,{" "}
          <code>**kalın**</code>, boş satırla paragraf.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        {kind === "post" ? (
          <>
            <label className={LABEL}>Durum</label>
            <select className={FIELD + " sm:w-56"} value={f.status} onChange={(e) => set("status", e.target.value)}>
              {POST_STATUSES.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.l}
                </option>
              ))}
            </select>
          </>
        ) : (
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#8B5CF6]"
              checked={f.isPublished}
              onChange={(e) => set("isPublished", e.target.checked)}
            />
            Yayında (kapalıysa sayfa herkese görünmez)
          </label>
        )}
      </div>

      {err && <p className="text-sm text-destructive">{err}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Kaydediliyor…" : mode === "create" ? "Oluştur" : "Değişiklikleri kaydet"}
        </button>
        <Link href={backHref} className="text-sm text-muted-foreground hover:text-foreground">
          Vazgeç
        </Link>
      </div>
    </form>
  );
}
