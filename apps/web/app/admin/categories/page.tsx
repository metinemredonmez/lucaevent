"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/page-header";

type Cat = { id: string; slug: string; name: string; position: number };

export default function CategoriesAdmin() {
  const [rows, setRows] = useState<Cat[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState("");

  function load() {
    api<Cat[]>("/categories").then(setRows).catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api("/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name, slug, position: rows.length }),
      });
      setName("");
      setSlug("");
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function del(id: string) {
    setErr("");
    try {
      await api(`/admin/categories/${id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div>
      <AdminPageHeader title="Kategoriler" subtitle="Etkinlik kategorileri ve sıralama." />
      {err && <p className="text-rose-400 text-sm mb-3">{err}</p>}

      <form onSubmit={add} className="mb-6 flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Ad</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Slug</label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="wellness" required />
        </div>
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
          Ekle
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Ad</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => del(c.id)}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
