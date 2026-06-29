"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Stats = {
  totalEvents: number;
  publishedEvents: number;
  totalSalesMinor: number;
  paidOrders: number;
  pendingOrders: number;
  canceledOrders: number;
  cancelRate: number;
  pendingReservations: number;
  occupancyRate: number;
  topEvent: { title: string; soldUnits: number; revenueMinor: number } | null;
};

const tl = (minor: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(
    (minor || 0) / 100,
  );
const pct = (x: number) => `%${Math.round((x || 0) * 100)}`;

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<Stats>("/admin/stats").then(setS).catch((e) => setErr(e.message));
  }, []);

  return (
    <div>
      <h1
        className="text-3xl text-foreground mb-1"
        style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}
      >
        Dashboard
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Genel bakış ve satış özeti.</p>

      {err && <p className="text-rose-400 text-sm">{err}</p>}
      {!s && !err && <p className="text-muted-foreground text-sm">Yükleniyor…</p>}

      {s && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Toplam satış" value={tl(s.totalSalesMinor)} sub={`${s.paidOrders} ödenmiş sipariş`} />
            <Stat label="Etkinlik" value={String(s.totalEvents)} sub={`${s.publishedEvents} yayında`} />
            <Stat label="Doluluk" value={pct(s.occupancyRate)} sub="yaklaşan etkinlikler" />
            <Stat label="İptal oranı" value={pct(s.cancelRate)} sub={`${s.canceledOrders} iptal`} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <Stat label="Bekleyen sipariş" value={String(s.pendingOrders)} />
            <Stat label="Bekleyen rezervasyon" value={String(s.pendingReservations)} />
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-xs text-muted-foreground">En popüler etkinlik</div>
              {s.topEvent ? (
                <>
                  <div className="mt-1 text-base font-semibold text-foreground">
                    {s.topEvent.title}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {s.topEvent.soldUnits} bilet · {tl(s.topEvent.revenueMinor)}
                  </div>
                </>
              ) : (
                <div className="mt-1 text-sm text-muted-foreground">—</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
