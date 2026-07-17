"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { discoverEvents, getLiveEvents, getCommunityCount, type DiscoverEvent } from "@/lib/events";

// "Şehrin Nabzı" — İstanbul etkinliklerinin canlı kalkış-panosu (departures board).
// Kart-grid değil: zaman eksenli (ŞU AN CANLI → BUGÜN → YARIN → BU HAFTA), amber saatler,
// teal canlı nabız. Çok-kaynaklı agregatör kimliği (kaynak etiketi).

type LiveRow = { slug: string; title: string };
const TR = "tr-TR";
const IST = { timeZone: "Europe/Istanbul" } as const;

function hhmm(iso: string) {
  return new Date(iso).toLocaleTimeString(TR, { hour: "2-digit", minute: "2-digit", hour12: false, ...IST });
}
function wd(iso: string) {
  return new Date(iso).toLocaleDateString(TR, { weekday: "short", ...IST });
}
function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function CityPulse() {
  const [rows, setRows] = useState<DiscoverEvent[]>([]);
  const [live, setLive] = useState<LiveRow[]>([]);
  const [members, setMembers] = useState<number | null>(null);
  const [clock, setClock] = useState("--:--:--");
  const [mode, setMode] = useState<"gunduz" | "gece">("gunduz");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      discoverEvents({ range: "upcoming", take: 60 }).catch(() => []),
      getLiveEvents().catch(() => []),
      getCommunityCount().catch(() => null),
    ]).then(([evs, lv, mem]) => {
      setRows(Array.isArray(evs) ? evs : []);
      setLive((Array.isArray(lv) ? lv : []).map((e) => ({ slug: e.slug, title: e.title })));
      setMembers(typeof mem === "number" ? mem : null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString(TR, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, ...IST }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // zaman gruplarına ayır: BUGÜN / YARIN / BU HAFTA
  const groups = useMemo(() => {
    const now = new Date();
    const todayK = dayKey(now);
    const tmr = new Date(now);
    tmr.setDate(now.getDate() + 1);
    const tmrK = dayKey(tmr);
    const today: DiscoverEvent[] = [];
    const tomorrow: DiscoverEvent[] = [];
    const week: DiscoverEvent[] = [];
    for (const e of rows) {
      const d = new Date(e.startsAt);
      if (mode === "gece" && d.getHours() < 18) continue; // GECE: 18:00 sonrası
      const k = dayKey(d);
      if (k === todayK) today.push(e);
      else if (k === tmrK) tomorrow.push(e);
      else week.push(e);
    }
    return { today, tomorrow, week };
  }, [rows, mode]);

  const totalUpcoming = groups.today.length + groups.tomorrow.length + groups.week.length;

  return (
    <section className="cp">
      <style>{`
        .cp{background:#0a0b0d;color:#eceae4;padding:26px 20px 44px;
          background-image:radial-gradient(120% 70% at 50% -8%,rgba(246,167,35,.06),transparent 60%);
          font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
        .cp-in{max-width:1020px;margin:0 auto}
        .cp-mono{font-family:ui-monospace,'SF Mono','Roboto Mono',Menlo,monospace}
        .cp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .cp-kick{font-family:ui-monospace,monospace;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#26cdba}
        .cp-h1{font-weight:800;letter-spacing:-.02em;line-height:.94;text-transform:uppercase;
          font-size:clamp(38px,8vw,84px);margin:12px 0 0}
        .cp-h1 em{font-style:normal;color:#f6a723}
        .cp-clock{font-family:ui-monospace,monospace;font-size:14px;color:#f6a723;letter-spacing:.08em;
          border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:6px 11px;background:#0c0e11;margin-top:6px}
        .cp-stats{margin-top:18px;font-family:ui-monospace,monospace;font-size:13.5px;color:#8b8f93;display:flex;flex-wrap:wrap;gap:8px 22px}
        .cp-stats b{color:#eceae4;font-weight:600}
        .cp-ring{display:inline-block;width:8px;height:8px;border-radius:50%;background:#26cdba;vertical-align:1px;
          animation:cpRing 1.8s ease-out infinite}
        @keyframes cpRing{0%{box-shadow:0 0 0 0 rgba(38,205,186,.55)}70%{box-shadow:0 0 0 9px rgba(38,205,186,0)}100%{box-shadow:0 0 0 0 rgba(38,205,186,0)}}
        .cp-cmd{display:flex;align-items:center;gap:12px;margin:24px 0 6px;border:1px solid rgba(255,255,255,.1);
          border-radius:12px;background:#0d0f12;padding:15px 18px;text-decoration:none;color:inherit;transition:border-color .15s}
        .cp-cmd:hover{border-color:rgba(246,167,35,.5)}
        .cp-cmd .q{flex:1;font-size:16px;color:#8b8f93}
        .cp-cmd .k{font-family:ui-monospace,monospace;font-size:11px;color:#5c6165;border:1px solid rgba(255,255,255,.1);border-radius:5px;padding:3px 7px}
        .cp-toggle{display:flex;font-family:ui-monospace,monospace;font-size:11px;border:1px solid rgba(255,255,255,.1);border-radius:999px;overflow:hidden}
        .cp-toggle button{padding:6px 13px;letter-spacing:.14em;color:#8b8f93;background:transparent;border:none;cursor:pointer;font-family:inherit;font-size:inherit}
        .cp-toggle button.on{background:#f6a723;color:#1a1206;font-weight:700}
        .cp-board{margin-top:24px;border:1px solid rgba(255,255,255,.09);border-radius:14px;overflow:hidden;background:#0f1114}
        .cp-grp{font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.22em;text-transform:uppercase;
          padding:15px 18px 8px;color:#f6a723;display:flex;align-items:center;gap:9px}
        .cp-grp.now{color:#26cdba}
        .cp-grp .rule{flex:1;height:1px;background:rgba(255,255,255,.08)}
        .cp-row{display:grid;grid-template-columns:76px 1fr 118px;gap:14px;align-items:center;padding:12px 18px;
          border-top:1px solid rgba(255,255,255,.05);text-decoration:none;color:inherit;transition:background .12s}
        .cp-row:hover{background:#161a1f}
        .cp-row.live{background:#122019}
        .cp-t{font-family:ui-monospace,monospace;font-size:17px;color:#f6a723;font-weight:500}
        .cp-row.live .cp-t{color:#26cdba;font-size:13px}
        .cp-n{font-weight:600;font-size:15.5px;letter-spacing:-.01em}
        .cp-v{font-family:ui-monospace,monospace;font-size:12px;color:#8b8f93;margin-top:2px}
        .cp-tag{font-family:ui-monospace,monospace;font-size:10.5px;letter-spacing:.06em;padding:3px 9px;border-radius:5px;
          border:1px solid rgba(255,255,255,.1);color:#8b8f93;justify-self:end;white-space:nowrap}
        .cp-tag.luca{color:#26cdba;border-color:rgba(38,205,186,.35)}
        .cp-empty{padding:34px 18px;text-align:center;color:#8b8f93;font-family:ui-monospace,monospace;font-size:13px}
        @media (max-width:640px){.cp-row{grid-template-columns:60px 1fr auto}.cp-tag{display:none}.cp-h1{font-size:40px}}
      `}</style>

      <div className="cp-in">
        <div className="cp-head">
          <div>
            <div className="cp-kick">Şehrin nabzı · canlı</div>
            <h1 className="cp-h1">Şu an İstanbul'da <em>ne var?</em></h1>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <span className="cp-clock cp-mono">{clock}</span>
            <div className="cp-toggle">
              <button className={mode === "gunduz" ? "on" : ""} onClick={() => setMode("gunduz")}>GÜNDÜZ</button>
              <button className={mode === "gece" ? "on" : ""} onClick={() => setMode("gece")}>GECE</button>
            </div>
          </div>
        </div>

        <div className="cp-stats">
          <span><span className="cp-ring" /> <b>{live.length}</b> etkinlik şu an canlı</span>
          <span><b>{totalUpcoming}</b> yaklaşan</span>
          {members != null && <span><b>{new Intl.NumberFormat(TR).format(members)}</b> kişilik topluluk</span>}
        </div>

        <Link href="/kesfet" className="cp-cmd">
          <span className="cp-mono" style={{ color: "#f6a723" }}>⌕</span>
          <span className="q">Bu gece ne yapsam? · Kadıköy'de atölye · hafta sonu tekne…</span>
          <span className="k">keşfet</span>
        </Link>

        <div className="cp-board">
          {loading ? (
            <div className="cp-empty">Şehir taranıyor…</div>
          ) : live.length === 0 && totalUpcoming === 0 ? (
            <div className="cp-empty">Şu an listede etkinlik yok — yakında burada olacak.</div>
          ) : (
            <>
              {live.length > 0 && (
                <>
                  <div className="cp-grp now"><span className="cp-ring" /> Şu an canlı <span className="rule" /></div>
                  {live.map((e) => (
                    <Link key={e.slug} href={`/canli/${e.slug}`} className="cp-row live">
                      <span className="cp-t">CANLI</span>
                      <div><div className="cp-n">{e.title}</div><div className="cp-v">● yayında</div></div>
                      <span className="cp-tag luca">Luca</span>
                    </Link>
                  ))}
                </>
              )}
              <BoardGroup label="Bugün" events={groups.today} />
              <BoardGroup label="Yarın" events={groups.tomorrow} />
              <BoardGroup label="Bu hafta" events={groups.week} showDay />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function BoardGroup({ label, events, showDay }: { label: string; events: DiscoverEvent[]; showDay?: boolean }) {
  if (events.length === 0) return null;
  return (
    <>
      <div className="cp-grp">{label} <span className="rule" /></div>
      {events.map((e) => (
        <Link key={e.slug} href={`/etkinlik/${e.slug}`} className="cp-row">
          <span className="cp-t">{showDay ? wd(e.startsAt) : hhmm(e.startsAt)}</span>
          <div>
            <div className="cp-n">{e.title}</div>
            <div className="cp-v">
              {showDay ? `${hhmm(e.startsAt)} · ` : ""}
              {e.venue?.name ?? e.category?.name ?? "İstanbul"}
            </div>
          </div>
          <span className="cp-tag luca">Luca</span>
        </Link>
      ))}
    </>
  );
}
