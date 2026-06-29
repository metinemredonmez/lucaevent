"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Check, ShieldAlert } from "lucide-react";
import { resetPassword, passwordScore } from "@/lib/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const INP =
  "bg-[#171336] border-[#352E6B] text-white placeholder:text-[#6E6796] focus-visible:ring-[#8B5CF6]";
const STRENGTH = ["Çok zayıf", "Zayıf", "Orta", "İyi", "Güçlü"];
const STRENGTH_COLOR = ["#FB7185", "#FB7185", "#FBBF24", "#A3E635", "#34D399"];

const FEATURES = [
  "Yeni şifren anında geçerli olur",
  "Tüm cihazlarda güvenli oturum",
  "Hesabın korunur",
];

function ResetInner() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const score = passwordScore(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (password.length < 8) return setErr("Şifre en az 8 karakter olmalı.");
    if (score < 2) return setErr("Daha güçlü bir şifre seç (harf + rakam).");
    if (password !== confirm) return setErr("Şifreler eşleşmiyor.");
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (e: any) {
      setErr(e.message || "Bağlantı geçersiz veya süresi dolmuş.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell headline="Yeni bir başlangıç." caption="Şifreni güncelle, devam et." features={FEATURES}>
      {!token ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FB7185]/15">
            <ShieldAlert className="h-6 w-6 text-[#FB7185]" />
          </div>
          <h1 className="text-2xl text-white" style={{ fontFamily: "Georgia, serif" }}>
            Geçersiz bağlantı
          </h1>
          <p className="mt-2 text-sm text-[#A39DC9]">
            Bu sıfırlama bağlantısı eksik ya da hatalı. Yeni bir bağlantı iste.
          </p>
          <Link href="/sifremi-unuttum" className="mt-6 inline-block text-sm text-[#A78BFA] hover:underline">
            Yeni bağlantı iste
          </Link>
        </div>
      ) : done ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#34D399]/15">
            <Check className="h-6 w-6 text-[#34D399]" />
          </div>
          <h1 className="text-2xl text-white" style={{ fontFamily: "Georgia, serif" }}>
            Şifren güncellendi
          </h1>
          <p className="mt-2 text-sm text-[#A39DC9]">Artık yeni şifrenle giriş yapabilirsin.</p>
          <Button
            asChild
            className="mt-6 w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 text-white"
          >
            <Link href="/giris">Giriş yap</Link>
          </Button>
        </div>
      ) : (
        <>
          <h1 className="text-3xl text-white" style={{ fontFamily: "Georgia, serif" }}>
            Yeni şifre belirle
          </h1>
          <p className="mt-1 text-sm text-[#A39DC9]">Güçlü ve hatırlayabileceğin bir şifre seç.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs text-[#A39DC9]">Yeni şifre</label>
              <div className="relative">
                <Input
                  className={INP}
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 8 karakter"
                  required
                  autoFocus
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6796]" tabIndex={-1}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#2E2856]">
                    <div className="h-full transition-all" style={{ width: `${(score / 4) * 100}%`, background: STRENGTH_COLOR[score] }} />
                  </div>
                  <span className="mt-1 inline-block text-xs" style={{ color: STRENGTH_COLOR[score] }}>{STRENGTH[score]}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-[#A39DC9]">Yeni şifre (tekrar)</label>
              <Input
                className={INP}
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Şifreni tekrar gir"
                required
              />
            </div>
            {err && <p className="text-sm text-[#FB7185]">{err}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 text-white shadow-lg shadow-[#6366F1]/20"
            >
              {loading ? "Güncelleniyor…" : "Şifreyi güncelle"}
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}

export default function SifreSifirla() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}
