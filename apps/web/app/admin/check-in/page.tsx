"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";

type Result = {
  status: "OK" | "ALREADY_USED" | "INVALID";
  holderName?: string;
  reason?: string;
  checkedInAt?: string;
  at: number;
};

const STYLE: Record<string, { box: string; label: string }> = {
  OK: { box: "border-[#657257] bg-[#657257]/10 text-[#3A5A3A]", label: "GİRİŞ OK ✓" },
  ALREADY_USED: {
    box: "border-[#B5852A] bg-[#B5852A]/10 text-[#8a6410]",
    label: "ZATEN KULLANILDI ⚠",
  },
  INVALID: { box: "border-[#A23E48] bg-[#A23E48]/10 text-[#A23E48]", label: "GEÇERSİZ ✕" },
};

export default function CheckIn() {
  const [code, setCode] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    setCode("");
    try {
      const r = await api<Result>("/tickets/check-in", {
        method: "POST",
        body: JSON.stringify({ code: c }),
      });
      setResults((p) => [{ ...r, at: Date.now() }, ...p].slice(0, 12));
    } catch (e: any) {
      setResults((p) =>
        [{ status: "INVALID", reason: e.message, at: Date.now() } as Result, ...p].slice(0, 12),
      );
    }
    inputRef.current?.focus();
  }

  const okCount = results.filter((r) => r.status === "OK").length;

  return (
    <div>
      <h1
        className="text-3xl text-[#171717] mb-1"
        style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}
      >
        Kapı Check-in
      </h1>
      <p className="text-sm text-[#6F6F6F] mb-6">
        QR okut veya bilet kodunu yapıştır, Enter'a bas. Bu oturumda {okCount} giriş.
      </p>

      <form onSubmit={submit} className="mb-6">
        <input
          ref={inputRef}
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Bilet kodu / QR…"
          className="w-full rounded-xl border-2 border-[#E3DED5] bg-white px-5 py-4 text-lg outline-none focus:border-[#C86B42]"
        />
      </form>

      <div className="space-y-2">
        {results.map((r, i) => {
          const st = STYLE[r.status];
          return (
            <div
              key={r.at + "-" + i}
              className={`rounded-xl border-2 px-5 py-4 ${st.box}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{st.label}</span>
                <span className="text-xs opacity-70">
                  {new Date(r.at).toLocaleTimeString("tr-TR")}
                </span>
              </div>
              {r.holderName && <div className="text-sm mt-1">{r.holderName}</div>}
              {r.reason && <div className="text-xs mt-1 opacity-80">{r.reason}</div>}
              {r.checkedInAt && (
                <div className="text-xs mt-1 opacity-80">
                  İlk giriş: {new Date(r.checkedInAt).toLocaleString("tr-TR")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
