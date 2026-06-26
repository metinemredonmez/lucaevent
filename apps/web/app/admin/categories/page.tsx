"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
      <h1
        className="text-3xl text-[#171717] mb-1"
        style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}
      >
        Kategoriler
      </h1>
      <p className="text-sm text-[#6F6F6F] mb-6">{rows.length} dikey</p>
      {err && <p className="text-[#A23E48] text-sm mb-3">{err}</p>}

      <form onSubmit={add} className="mb-6 flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-[#6F6F6F]">Ad</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="flex-1">
          <label className="text-xs text-[#6F6F6F]">Slug</label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="wellness" required />
        </div>
        <Button type="submit" className="bg-[#C86B42] hover:bg-[#b35c36] text-white">
          Ekle
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-[#E3DED5] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F5F0] text-left text-xs text-[#6F6F6F]">
            <tr>
              <th className="px-4 py-3 font-medium">Ad</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-[#E3DED5]">
                <td className="px-4 py-3 font-medium text-[#171717]">{c.name}</td>
                <td className="px-4 py-3 text-[#6F6F6F]">{c.slug}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => del(c.id)}
                    className="text-xs text-[#A23E48] hover:underline"
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
