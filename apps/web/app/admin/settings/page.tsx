"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Setting = {
  key: string;
  label: string;
  category: string;
  isSecret: boolean;
  source: "db" | "env" | "unset";
  configured: boolean;
  value: string;
};

const CAT_LABEL: Record<string, string> = {
  auth: "Kimlik (Google)",
  payment: "Ödeme (Iyzico)",
  push: "Push (OneSignal)",
  mail: "E-posta (SMTP)",
  general: "Genel",
};

const SOURCE_BADGE: Record<string, string> = {
  db: "bg-[#657257]/15 text-emerald-400",
  env: "bg-[#3E5A78]/15 text-sky-400",
  unset: "bg-[#A23E48]/15 text-rose-400",
};

export default function SettingsAdmin() {
  const [items, setItems] = useState<Setting[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    api<Setting[]>("/admin/settings").then(setItems).catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  async function save() {
    const payload = Object.entries(edits)
      .filter(([, v]) => v !== "")
      .map(([key, value]) => ({ key, value }));
    if (payload.length === 0) {
      setMsg("Değişiklik yok.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      await api("/admin/settings", { method: "PATCH", body: JSON.stringify({ items: payload }) });
      setEdits({});
      setMsg(`${payload.length} ayar kaydedildi.`);
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  const cats = [...new Set(items.map((i) => i.category))];

  return (
    <div>
      <h1
        className="text-3xl text-foreground mb-1"
        style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}
      >
        Ayarlar & Entegrasyonlar
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Anahtarlar burada yönetilir — .env'e dokunmana gerek yok. Secret'lar şifreli saklanır.
      </p>
      {err && <p className="text-rose-400 text-sm mb-3">{err}</p>}
      {msg && <p className="text-emerald-400 text-sm mb-3">{msg}</p>}

      <div className="space-y-6">
        {cats.map((cat) => (
          <div key={cat} className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              {CAT_LABEL[cat] ?? cat}
            </h2>
            <div className="space-y-4">
              {items
                .filter((i) => i.category === cat)
                .map((i) => (
                  <div key={i.key} className="grid grid-cols-[1fr_2fr] items-center gap-4">
                    <div>
                      <div className="text-sm text-foreground">{i.label}</div>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] ${SOURCE_BADGE[i.source]}`}
                      >
                        {i.source === "db" ? "DB" : i.source === "env" ? "ENV" : "AYARLANMAMIŞ"}
                      </span>
                    </div>
                    <Input
                      type={i.isSecret ? "password" : "text"}
                      placeholder={i.isSecret ? i.value || "•••• (gizli)" : i.value}
                      value={edits[i.key] ?? ""}
                      onChange={(e) =>
                        setEdits((p) => ({ ...p, [i.key]: e.target.value }))
                      }
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button
          onClick={save}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}
