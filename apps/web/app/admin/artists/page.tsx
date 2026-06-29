"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Artist = {
  id: string;
  slug: string;
  name: string;
  bio?: string | null;
  country?: string | null;
  instagram?: string | null;
  soundcloud?: string | null;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EMPTY = {
  name: "",
  slug: "",
  country: "",
  instagram: "",
  soundcloud: "",
  bio: "",
};

export default function ArtistsAdmin() {
  const [rows, setRows] = useState<Artist[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [delBusy, setDelBusy] = useState("");
  const [err, setErr] = useState("");

  function load() {
    api<Artist[]>("/artists")
      .then(setRows)
      .catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  function set(key: keyof typeof EMPTY, value: string) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && !slugTouched) next.slug = slugify(value);
      return next;
    });
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await api("/admin/artists", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          country: form.country.trim() || null,
          instagram: form.instagram.trim() || null,
          soundcloud: form.soundcloud.trim() || null,
          bio: form.bio.trim() || null,
        }),
      });
      setForm({ ...EMPTY });
      setSlugTouched(false);
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function del(a: Artist) {
    if (!confirm(`${a.name} sanatçısı silinsin mi?`)) return;
    setDelBusy(a.id);
    setErr("");
    try {
      await api(`/admin/artists/${a.id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setDelBusy("");
    }
  }

  return (
    <div>
      <h1
        className="mb-1 text-3xl text-foreground"
        style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}
      >
        Sanatçılar
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">{rows.length} sanatçı</p>

      {err && <p className="mb-3 text-sm text-rose-400">{err}</p>}

      <form
        onSubmit={add}
        className="mb-6 rounded-xl border border-border bg-card p-5"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Ad</span>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-[#C86B42]"
              placeholder="Sanatçı adı"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Slug</span>
            <input
              required
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
              className="w-full rounded-md border border-border bg-card px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-[#C86B42]"
              placeholder="sanatci-adi"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Ülke</span>
            <input
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-[#C86B42]"
              placeholder="Türkiye"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Instagram</span>
            <input
              value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-[#C86B42]"
              placeholder="@kullaniciadi"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">SoundCloud</span>
            <input
              value={form.soundcloud}
              onChange={(e) => set("soundcloud", e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-[#C86B42]"
              placeholder="soundcloud.com/..."
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs text-muted-foreground">Bio</span>
            <textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              rows={3}
              className="w-full resize-y rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-[#C86B42]"
              placeholder="Kısa biyografi"
            />
          </label>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Ekleniyor…" : "Ekle"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Ad</th>
              <th className="px-4 py-3 font-medium">Ülke</th>
              <th className="px-4 py-3 font-medium">Instagram</th>
              <th className="px-4 py-3 text-right font-medium">Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-border align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{a.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{a.slug}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{a.country || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {a.instagram || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    disabled={delBusy === a.id}
                    onClick={() => del(a)}
                    className="rounded-md border border-[#A23E48] px-2 py-1 text-xs text-rose-400 transition-colors hover:bg-[#A23E48]/10 disabled:opacity-60"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !err && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Kayıt yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
