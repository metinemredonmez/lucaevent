"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowDown, ArrowUp, Plus, Trash2, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/page-header";

type Item = {
  id: string;
  url: string;
  videoId: string;
  title: string;
  author: string | null;
  thumbUrl: string | null;
  sort: number;
};
type Layout = "cinema" | "numbered" | "poster" | "featured";
type Collection = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  status: "DRAFT" | "PUBLISHED";
  layout: Layout;
  sort: number;
  items: Item[];
};

const LAYOUTS: { v: Layout; l: string }[] = [
  { v: "cinema", l: "Sinema — geniş 16:9 şerit" },
  { v: "numbered", l: "Numaralı liste — top" },
  { v: "poster", l: "Poster duvarı — dikey" },
  { v: "featured", l: "Öne çıkan + ızgara" },
];

export default function CollectionEdit() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [urls, setUrls] = useState("");

  useEffect(() => {
    api<Collection>(`/admin/collections/${id}`)
      .then(setC)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function patch(p: Partial<Collection>) {
    setC((prev) => (prev ? { ...prev, ...p } : prev));
  }

  async function save() {
    if (!c) return;
    setSaving(true);
    setErr("");
    setOk("");
    try {
      const saved = await api<Collection>(`/admin/collections/${c.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: c.title,
          slug: c.slug,
          subtitle: c.subtitle ?? "",
          status: c.status,
          layout: c.layout,
          sort: c.sort,
        }),
      });
      setC(saved);
      setOk("Kaydedildi.");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  // Her satıra bir link — başlık/kanal/kapak sunucuda oEmbed ile doldurulur.
  async function addItems() {
    if (!c) return;
    const list = urls
      .split(/[\n,\s]+/)
      .map((u) => u.trim())
      .filter(Boolean);
    if (list.length === 0) return;
    setAdding(true);
    setErr("");
    try {
      const updated = await api<Collection>(`/admin/collections/${c.id}/items`, {
        method: "POST",
        body: JSON.stringify({ urls: list }),
      });
      setC(updated);
      setUrls("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function removeItem(item: Item) {
    if (!c || !window.confirm(`"${item.title}" kaldırılsın mı?`)) return;
    setBusy(item.id);
    try {
      const updated = await api<Collection>(`/admin/collections/${c.id}/items/${item.id}`, {
        method: "DELETE",
      });
      setC(updated);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  async function move(index: number, dir: -1 | 1) {
    if (!c) return;
    const next = [...c.items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setC({ ...c, items: next }); // iyimser sıra — sunucu onaylayınca sabitlenir
    setBusy("order");
    try {
      const updated = await api<Collection>(`/admin/collections/${c.id}/items/order`, {
        method: "PATCH",
        body: JSON.stringify({ ids: next.map((i) => i.id) }),
      });
      setC(updated);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  async function removeCollection() {
    if (!c || !window.confirm(`"${c.title}" koleksiyonu silinsin mi?`)) return;
    try {
      await api(`/admin/collections/${c.id}`, { method: "DELETE" });
      router.push("/admin/collections");
    } catch (e: any) {
      setErr(e.message);
    }
  }

  if (loading) return <div className="py-10 text-center text-sm text-muted-foreground">Yükleniyor…</div>;
  if (!c)
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        {err || "Koleksiyon bulunamadı."}
      </div>
    );

  return (
    <div>
      <AdminPageHeader
        title={c.title}
        subtitle={`${c.items.length} video`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/collections"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[13px] text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Geri
            </Link>
            <button
              onClick={save}
              disabled={saving}
              className="h-9 rounded-lg bg-gradient-to-r from-[#0e9a8c] to-[#22c9b8] px-4 text-[13px] font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        }
      />

      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}
      {ok && <p className="mb-3 text-sm text-emerald-600 dark:text-emerald-400">{ok}</p>}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* koleksiyon bilgileri */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Başlık</label>
            <input
              value={c.title}
              onChange={(e) => patch({ title: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Alt başlık</label>
            <input
              value={c.subtitle ?? ""}
              onChange={(e) => patch({ subtitle: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Slug</label>
              <input
                value={c.slug}
                onChange={(e) => patch({ slug: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Sıra</label>
              <input
                type="number"
                min={0}
                value={c.sort}
                onChange={(e) => patch({ sort: Number(e.target.value) || 0 })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Durum</label>
            <select
              value={c.status}
              onChange={(e) => patch({ status: e.target.value as Collection["status"] })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            >
              <option value="DRAFT">Taslak (sitede görünmez)</option>
              <option value="PUBLISHED">Yayında</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Şerit tasarımı</label>
            <select
              value={c.layout}
              onChange={(e) => patch({ layout: e.target.value as Layout })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            >
              {LAYOUTS.map((l) => (
                <option key={l.v} value={l.v}>
                  {l.l}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Her koleksiyon ana sayfada bu tasarımla, ayrı bir şerit olarak görünür.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Yayındaki koleksiyonlar ana sayfada etkinlik panosunun altında, sıra değerine göre listelenir.
            Videosu olmayan koleksiyon sitede gösterilmez.
          </p>
          <button
            onClick={removeCollection}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-destructive/40 px-3 text-[13px] text-destructive transition hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" /> Koleksiyonu sil
          </button>
        </div>

        {/* videolar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <label className="mb-1 block text-xs text-muted-foreground">
              YouTube linkleri — her satıra bir tane
            </label>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={3}
              placeholder={"https://www.youtube.com/watch?v=…\nhttps://youtu.be/…"}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary/50"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Başlık, kanal ve kapak görseli otomatik çekilir. Aynı video ikinci kez eklenmez.
              </p>
              <button
                onClick={addItems}
                disabled={adding || !urls.trim()}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> {adding ? "Ekleniyor…" : "Ekle"}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {c.items.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Henüz video yok — yukarıdan link yapıştır.
              </div>
            )}
            <div className="divide-y divide-border">
              {c.items.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                  <div className="relative h-11 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.thumbUrl && (
                      <Image
                        src={item.thumbUrl}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-foreground">{item.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{item.author ?? item.videoId}</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" /> aç
                      </a>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0 || busy === "order"}
                      aria-label="Yukarı taşı"
                      className="grid size-8 place-items-center rounded-md border border-border text-foreground transition hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === c.items.length - 1 || busy === "order"}
                      aria-label="Aşağı taşı"
                      className="grid size-8 place-items-center rounded-md border border-border text-foreground transition hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeItem(item)}
                      disabled={busy === item.id}
                      aria-label="Kaldır"
                      className="grid size-8 place-items-center rounded-md border border-destructive/40 text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
