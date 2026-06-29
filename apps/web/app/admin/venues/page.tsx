"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/page-header";

type Venue = {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  capacity: number;
  coverUrl: string;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EMPTY = { name: "", slug: "", city: "", address: "", capacity: "", coverUrl: "" };

export default function VenuesAdmin() {
  const [rows, setRows] = useState<Venue[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  function load() {
    api<Venue[]>("/venues").then(setRows).catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  function setName(name: string) {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  }
  function setSlug(slug: string) {
    setSlugTouched(true);
    setForm((f) => ({ ...f, slug }));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy("add");
    try {
      await api("/admin/venues", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          city: form.city,
          address: form.address,
          capacity: Number(form.capacity) || 0,
          coverUrl: form.coverUrl,
        }),
      });
      setForm({ ...EMPTY });
      setSlugTouched(false);
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  async function remove(v: Venue) {
    if (!confirm(`${v.name} mekanı silinsin mi?`)) return;
    setBusy(v.id);
    try {
      await api(`/admin/venues/${v.id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  const input =
    "rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-[#C86B42]";

  return (
    <div>
      <AdminPageHeader title="Mekanlar" subtitle={`${rows.length} kayıt`} />

      {err && <p className="mb-3 text-sm text-rose-400">{err}</p>}

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <form onSubmit={add} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            className={input}
            placeholder="Ad"
            value={form.name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className={input}
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
          <input
            className={input}
            placeholder="Şehir"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <input
            className={input}
            placeholder="Adres"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
          <input
            className={input}
            type="number"
            placeholder="Kapasite"
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
          />
          <input
            className={input}
            placeholder="Kapak URL"
            value={form.coverUrl}
            onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))}
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={busy === "add"}
              className="rounded-md bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {busy === "add" ? "Ekleniyor…" : "Ekle"}
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Ad</th>
              <th className="px-4 py-3 font-medium">Şehir</th>
              <th className="px-4 py-3 font-medium">Adres</th>
              <th className="px-4 py-3 font-medium">Kapasite</th>
              <th className="px-4 py-3 text-right font-medium">Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} className="border-t border-border align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{v.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{v.slug}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{v.city}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.address}</td>
                <td className="px-4 py-3 tabular-nums text-foreground">{v.capacity}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    disabled={busy === v.id}
                    onClick={() => remove(v)}
                    className="rounded-md border border-[#A23E48] px-2 py-1 text-xs text-rose-400 hover:bg-[#A23E48]/10 disabled:opacity-60"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !err && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
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
