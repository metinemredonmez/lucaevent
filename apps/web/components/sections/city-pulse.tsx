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

// WMO hava kodu → durum + etiket (İstanbul'un o anki havası).
type Weather = { cond: "clear" | "clouds" | "rain" | "snow"; isDay: boolean; temp: number; label: string };
function mapWeather(code: number): { cond: Weather["cond"]; label: string } {
  if (code >= 71 && code <= 77) return { cond: "snow", label: "Karlı" };
  if (code >= 85 && code <= 86) return { cond: "snow", label: "Kar" };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) return { cond: "rain", label: "Yağmurlu" };
  if (code === 45 || code === 48) return { cond: "clouds", label: "Sisli" };
  if (code === 2 || code === 3) return { cond: "clouds", label: "Bulutlu" };
  return { cond: "clear", label: "Açık" };
}

// Hava + gündüz/gece → arka plan görseli (public/img/hero).
// isDay: GÜNDÜZ/GECE toggle'ından gelir (kullanıcı anında değiştirebilir).
function bgFor(w: Weather | null, isDay: boolean): string {
  const B = "/img/hero/";
  if (w?.cond === "rain") return B + "istanbul-rain.jpg";
  if (w?.cond === "snow") return B + "istanbul-snow.jpg";
  if (!isDay) return B + "bosphorus-night.jpg"; // gece (açık/bulutlu)
  if (w?.cond === "clouds") return B + "istanbul-cloudy.jpg";
  return B + "istanbul-dusk.jpg"; // açık · gündüz
}

export function CityPulse() {
  const [rows, setRows] = useState<DiscoverEvent[]>([]);
  const [live, setLive] = useState<LiveRow[]>([]);
  const [members, setMembers] = useState<number | null>(null);
  const [clock, setClock] = useState("--:--:--");
  const [mode, setMode] = useState<"gunduz" | "gece">("gunduz");
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<Weather | null>(null);

  // İstanbul'un o anki havası (Open-Meteo, anahtarsız) → arka plan + rozet
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=41.0082&longitude=28.9784&current=temperature_2m,weather_code,is_day&timezone=Europe%2FIstanbul")
      .then((r) => r.json())
      .then((d) => {
        const c = d?.current;
        if (!c) return;
        const m = mapWeather(c.weather_code);
        const isDay = c.is_day === 1;
        setWeather({ cond: m.cond, label: m.label, isDay, temp: Math.round(c.temperature_2m) });
        setMode(isDay ? "gunduz" : "gece"); // gerçek zamana göre başlat (kullanıcı toggle'la değiştirebilir)
      })
      .catch(() => {});
  }, []);

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
  const isDay = mode === "gunduz"; // arka plan gündüz/gece'yi toggle belirler
  const bgImg = bgFor(weather, isDay);

  return (
    <section className="cp">
      <style>{`
        .cp{position:relative;overflow:hidden;background:#0a0b0d;color:#eceae4;padding:26px 20px 44px;
          font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
        .cp-bg{position:absolute;inset:0 0 auto 0;height:560px;background-position:center top;background-size:cover;background-repeat:no-repeat;opacity:.42;animation:cpBgIn 1s ease both}
        @keyframes cpBgIn{from{opacity:0;transform:scale(1.04)}to{opacity:.42;transform:none}}
        .cp-bg::after{content:'';position:absolute;inset:0;
          background:linear-gradient(to bottom,rgba(10,11,13,.35) 0%,rgba(10,11,13,.55) 45%,rgba(10,11,13,.9) 80%,#0a0b0d 100%)}
        .cp-in{position:relative;z-index:1;max-width:1020px;margin:0 auto}
        /* hava efekti katmanı */
        .cp-fx{position:absolute;inset:0 0 auto 0;height:560px;z-index:0;pointer-events:none}
        .cp-fx.rain{background-image:linear-gradient(102deg,transparent 46%,rgba(200,225,235,.22) 50%,transparent 54%);
          background-size:9px 64px;animation:cpRain .62s linear infinite;opacity:.55}
        @keyframes cpRain{from{background-position:0 0}to{background-position:-14px 64px}}
        .cp-fx.snow{background-image:radial-gradient(2px 2px at 20% 12%,#fff 50%,transparent 51%),radial-gradient(2px 2px at 68% 38%,rgba(255,255,255,.85) 50%,transparent 51%),radial-gradient(1.6px 1.6px at 44% 66%,#fff 50%,transparent 51%);
          background-size:200px 320px;animation:cpSnow 7s linear infinite;opacity:.85}
        @keyframes cpSnow{to{background-position:0 320px,0 320px,0 320px}}
        .cp-fx.clouds{background-image:radial-gradient(60% 42% at 28% 26%,rgba(255,255,255,.10),transparent 60%),radial-gradient(52% 36% at 76% 44%,rgba(255,255,255,.08),transparent 60%);
          filter:blur(3px);animation:cpDrift 26s ease-in-out infinite alternate}
        @keyframes cpDrift{to{transform:translateX(42px)}}
        .cp-fx.clear.day{background-image:radial-gradient(38% 40% at 84% 10%,rgba(246,167,35,.22),transparent 62%);animation:cpGlow 6.5s ease-in-out infinite}
        @keyframes cpGlow{0%,100%{opacity:.55}50%{opacity:1}}
        .cp-fx.clear.night{background-image:radial-gradient(1px 1px at 16% 22%,#fff,transparent),radial-gradient(1px 1px at 58% 14%,#fff,transparent),radial-gradient(1.4px 1.4px at 82% 30%,#fff,transparent),radial-gradient(1px 1px at 38% 40%,#fff,transparent);
          animation:cpTwinkle 3.4s ease-in-out infinite;opacity:.5}
        @keyframes cpTwinkle{0%,100%{opacity:.3}50%{opacity:.7}}
        .cp-wx{display:inline-flex;align-items:center;gap:7px;font-size:12px;color:#c9ccce;
          border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:4px 11px;background:#0c0e11}
        .cp-wx-dot{width:7px;height:7px;border-radius:50%}
        @media (prefers-reduced-motion:reduce){.cp-fx{animation:none!important}}
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

      <div
        key={bgImg}
        className="cp-bg"
        aria-hidden
        style={{ backgroundImage: `url(${bgImg})` }}
      />
      {weather && <div className={`cp-fx ${weather.cond} ${isDay ? "day" : "night"}`} aria-hidden />}
      <div className="cp-in">
        <div className="cp-head">
          <div>
            <div className="cp-kick">Şehrin nabzı · canlı</div>
            <h1 className="cp-h1">Şu an İstanbul'da <em>ne var?</em></h1>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            {weather && (
              <span className="cp-wx cp-mono">
                <span className="cp-wx-dot" style={{ background: { clear: "#f6a723", clouds: "#9aa0a3", rain: "#4aa3d8", snow: "#e8f0f4" }[weather.cond] }} />
                İstanbul · {weather.temp}° · {weather.label}
              </span>
            )}
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
