"use client";

import { useState } from "react";
import { api } from "@/lib/api";

type Job = {
  key: string;
  title: string;
  desc: string;
  path: string;
};

const JOBS: Job[] = [
  {
    key: "abandoned-sweep",
    title: "Terkedilmiş siparişleri temizle",
    desc: "Ödeme adımında yarıda kalmış / terkedilmiş siparişleri tarar ve temizler.",
    path: "/admin/jobs/abandoned-sweep",
  },
  {
    key: "reminders",
    title: "Hatırlatmaları gönder",
    desc: "Yaklaşan rezervasyonlar için bekleyen hatırlatma bildirimlerini gönderir.",
    path: "/admin/jobs/reminders",
  },
];

export default function MaintenanceAdmin() {
  const [busy, setBusy] = useState("");
  const [results, setResults] = useState<Record<string, any>>({});
  const [err, setErr] = useState("");

  async function run(job: Job) {
    setErr("");
    setBusy(job.key);
    try {
      const data = await api<any>(job.path, { method: "POST" });
      setResults((prev) => ({ ...prev, [job.key]: data }));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-3xl text-foreground" style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}>
        Bakım / İşler
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">Zamanlanmış görevleri elle tetikleyin.</p>

      {err && <p className="mb-3 text-sm text-rose-400">{err}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {JOBS.map((job) => {
          const running = busy === job.key;
          const result = results[job.key];
          return (
            <div key={job.key} className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-1 text-lg font-medium text-foreground">{job.title}</h2>
              <p className="mb-4 text-sm text-muted-foreground">{job.desc}</p>

              <button
                disabled={running}
                onClick={() => run(job)}
                className="rounded-md bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {running ? "çalışıyor..." : "Çalıştır"}
              </button>

              {result !== undefined && (
                <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-xs text-foreground">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
