"use client";

import { useEffect, useRef, useState } from "react";

/* ————————————————————— count-up ————————————————————— */
function useCountUp(target: number, ms = 600): number {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(a + (target - a) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function CountUp({
  value,
  format,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const v = useCountUp(value);
  return (
    <span className={className}>
      {format ? format(v) : Math.round(v).toLocaleString("tr-TR")}
    </span>
  );
}

/* ————————————————————— sparkline ————————————————————— */
export function Sparkline({
  data,
  color = "hsl(var(--primary))",
  w = 72,
  h = 24,
  className,
}: {
  data: number[];
  color?: string;
  w?: number;
  h?: number;
  className?: string;
}) {
  const n = data.length;
  if (n === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const flat = max === min; // mostly the all-zero case
  const range = max - min || 1;
  const pad = 2.5;
  const pts = data.map((val, i) => {
    const x = n === 1 ? w / 2 : pad + (i / (n - 1)) * (w - pad * 2);
    const y = flat ? h / 2 : h - pad - ((val - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[n - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} fill="none" className={className}>
      <path
        d={d}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={flat ? 0.45 : 1}
      />
      <circle cx={last[0]} cy={last[1]} r={2} fill={color} />
    </svg>
  );
}

/* ————————————————————— meter bar ————————————————————— */
export function MeterBar({
  value,
  color = "hsl(var(--primary))",
  label,
  right,
}: {
  value: number;
  color?: string;
  label?: string;
  right?: string;
}) {
  const pct = Math.max(0, Math.min(1, value || 0));
  return (
    <div>
      {(label || right) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium tabular-nums text-foreground">{right}</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

/* ————————————————————— category donut ————————————————————— */
const VIOLET_RAMP = [
  "#C4B5FD",
  "#A78BFA",
  "#8B5CF6",
  "#7C3AED",
  "#6D28D9",
  "#5B21B6",
  "#4C1D95",
  "#3B0764",
];

export function CategoryDonut({
  data,
  size = 168,
  stroke = 20,
}: {
  data: { name: string; count: number }[];
  size?: number;
  stroke?: number;
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  const drawn = data.filter((d) => d.count > 0);
  const colorOf = new Map(drawn.map((d, i) => [d.name, VIOLET_RAMP[i % VIOLET_RAMP.length]]));

  let acc = 0;
  const segs = drawn.map((d) => {
    const len = (d.count / total) * circ;
    const seg = { len, gap: circ - len, offset: -acc, color: colorOf.get(d.name)! };
    acc += len;
    return seg;
  });

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
          {segs.map((s, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${s.len.toFixed(2)} ${s.gap.toFixed(2)}`}
              strokeDashoffset={s.offset.toFixed(2)}
              style={{ transition: "stroke-dasharray .7s ease-out" }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-2xl font-semibold tabular-nums text-foreground">{total}</div>
            <div className="text-[11px] text-muted-foreground">etkinlik</div>
          </div>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: colorOf.get(d.name) ?? "hsl(var(--muted))" }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.name}</span>
            <span className="tabular-nums font-medium text-foreground">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ————————————————————— occupancy ring ————————————————————— */
export function OccupancyRing({
  value,
  size = 140,
  stroke = 13,
  label = "doluluk",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(1, value || 0));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  const len = pct * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${len.toFixed(2)} ${(circ - len).toFixed(2)}`}
          style={{ transition: "stroke-dasharray .7s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-semibold tabular-nums text-foreground">
            %{Math.round(pct * 100)}
          </div>
          <div className="text-[11px] text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

/* ————————————————————— area trend (focal) ————————————————————— */
export function AreaTrend({
  series,
  format,
}: {
  series: { date: string; revenueMinor: number; paidOrders: number }[];
  format: (minor: number) => string;
}) {
  const W = 640;
  const H = 200;
  const padX = 10;
  const padTop = 18;
  const padBottom = 28;
  const n = series.length;
  const vals = series.map((s) => s.revenueMinor);
  const max = Math.max(...vals, 0);
  const allZero = max === 0;
  const niceMax = allZero ? 1 : max * 1.18;

  const x = (i: number) => padX + (n <= 1 ? 0 : (i / (n - 1)) * (W - padX * 2));
  const y = (v: number) => padTop + (1 - v / niceMax) * (H - padTop - padBottom);

  const linePath = series
    .map((s, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(s.revenueMinor).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${x(n - 1).toFixed(1)},${(H - padBottom).toFixed(1)} L${x(0).toFixed(1)},${(H - padBottom).toFixed(1)} Z`;

  const grid = [0, 0.25, 0.5, 0.75, 1].map((g) => padTop + g * (H - padTop - padBottom));
  const [hover, setHover] = useState<number | null>(null);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (W / rect.width);
    let i = Math.round(((px - padX) / (W - padX * 2)) * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    setHover(i);
  }

  const fmtDay = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  };

  const hv = hover != null ? series[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="lucaArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {grid.map((gy, i) => (
          <line
            key={i}
            x1={padX}
            x2={W - padX}
            y1={gy}
            y2={gy}
            stroke="hsl(var(--border))"
            strokeWidth={1}
            strokeDasharray={i === grid.length - 1 ? "0" : "3 4"}
            opacity={i === grid.length - 1 ? 1 : 0.5}
          />
        ))}
        {!allZero && <path d={areaPath} fill="url(#lucaArea)" />}
        <path
          d={linePath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2.25}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={allZero ? 0.5 : 1}
        />
        {hv && !allZero && (
          <g>
            <line x1={x(hover!)} x2={x(hover!)} y1={padTop} y2={H - padBottom} stroke="hsl(var(--primary))" strokeWidth={1} opacity={0.4} />
            <circle cx={x(hover!)} cy={y(hv.revenueMinor)} r={3.5} fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth={1.5} />
          </g>
        )}
      </svg>
      {allZero && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="rounded-full bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            İlk satışı bekliyoruz
          </span>
        </div>
      )}
      {hv && !allZero && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: `${(x(hover!) / W) * 100}%`, top: 0 }}
        >
          <div className="font-medium text-foreground">{format(hv.revenueMinor)}</div>
          <div className="text-muted-foreground">
            {fmtDay(hv.date)} · {hv.paidOrders} sipariş
          </div>
        </div>
      )}
    </div>
  );
}
