"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  usedCount: number;
  maxUses: number | null;
  isActive: boolean;
};

export default function CouponsAdmin() {
  const [rows, setRows] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState("20");
  const [maxUses, setMaxUses] = useState("");
  const [err, setErr] = useState("");

  function load() {
    api<Coupon[]>("/admin/coupons").then(setRows).catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api("/admin/coupons", {
        method: "POST",
        body: JSON.stringify({
          code,
          type,
          value: Number(value),
          ...(maxUses ? { maxUses: Number(maxUses) } : {}),
        }),
      });
      setCode("");
      setMaxUses("");
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function del(id: string) {
    try {
      await api(`/admin/coupons/${id}`, { method: "DELETE" });
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
        Kuponlar
      </h1>
      <p className="text-sm text-[#6F6F6F] mb-6">{rows.length} kupon</p>
      {err && <p className="text-[#A23E48] text-sm mb-3">{err}</p>}

      <form onSubmit={add} className="mb-6 flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-[#6F6F6F]">Kod</label>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="YAZ25" required />
        </div>
        <div>
          <label className="text-xs text-[#6F6F6F]">Tip</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="block h-10 rounded-md border border-[#E3DED5] bg-white px-3 text-sm"
          >
            <option value="PERCENT">% Yüzde</option>
            <option value="FIXED">Sabit (kuruş)</option>
          </select>
        </div>
        <div className="w-28">
          <label className="text-xs text-[#6F6F6F]">Değer</label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} type="number" required />
        </div>
        <div className="w-28">
          <label className="text-xs text-[#6F6F6F]">Max kullanım</label>
          <Input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} type="number" placeholder="∞" />
        </div>
        <Button type="submit" className="bg-[#C86B42] hover:bg-[#b35c36] text-white">
          Ekle
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-[#E3DED5] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F5F0] text-left text-xs text-[#6F6F6F]">
            <tr>
              <th className="px-4 py-3 font-medium">Kod</th>
              <th className="px-4 py-3 font-medium">İndirim</th>
              <th className="px-4 py-3 font-medium">Kullanım</th>
              <th className="px-4 py-3 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-[#E3DED5]">
                <td className="px-4 py-3 font-medium text-[#171717]">{c.code}</td>
                <td className="px-4 py-3 text-[#6F6F6F]">
                  {c.type === "PERCENT" ? `%${c.value}` : `${(c.value / 100).toFixed(0)} TL`}
                </td>
                <td className="px-4 py-3 text-[#6F6F6F]">
                  {c.usedCount}
                  {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => del(c.id)} className="text-xs text-[#A23E48] hover:underline">
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
