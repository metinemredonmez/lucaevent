"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

const ROLES = ["SUPERADMIN", "ADMIN", "EDITOR", "DOOR", "VIEWER"];

export default function UsersAdmin() {
  const [rows, setRows] = useState<User[]>([]);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  function load() {
    setErr("");
    api<User[]>("/admin/users")
      .then(setRows)
      .catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  async function changeRole(id: string, role: string) {
    setBusy(id);
    setErr("");
    try {
      await api(`/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <AdminPageHeader title="Kullanıcılar" subtitle="Üyeler ve ekip rolleri." />

      {err && <p className="mb-3 text-sm text-rose-400">{err}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">E-posta</th>
              <th className="px-4 py-3 font-medium">Ad</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-border align-top">
                <td className="px-4 py-3 font-medium text-foreground">{u.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.name}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={busy === u.id}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground focus:border-[#C86B42] focus:outline-none disabled:opacity-50"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {u.isActive ? (
                    <span className="inline-block rounded-full bg-[#657257]/15 px-2 py-0.5 text-xs text-emerald-400">
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-[#6F6F6F]/15 px-2 py-0.5 text-xs text-muted-foreground">
                      Pasif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTR(u.createdAt)}</td>
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
