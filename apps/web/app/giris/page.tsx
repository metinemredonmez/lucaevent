"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const INP =
  "bg-[#171336] border-[#352E6B] text-white placeholder:text-[#6E6796] focus-visible:ring-[#8B5CF6]";
const LBL = "block text-sm font-medium text-[#C4B5FD] mb-1.5";

export default function Giris() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await loginUser(email, password);
      router.replace("/");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      headline="Tekrar hoş geldin."
      caption="Kaldığın yerden devam et."
      features={[
        "Biletlerin ve rezervasyonların tek yerde",
        "Favori etkinliklerini takip et",
        "İlgi alanına göre sana özel öneriler",
      ]}
    >
      {/* ortalı, sade başlık (yoga minimal yapı + Luca serif marka) */}
      <div className="mb-7 text-center">
        <h1 className="text-3xl text-white" style={{ fontFamily: "Georgia, serif" }}>
          Tekrar hoş geldin
        </h1>
        <p className="mt-1.5 text-sm text-[#A39DC9]">Hesabına giriş yap</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={LBL} htmlFor="email">E-posta</label>
          <Input
            id="email"
            className={INP}
            type="email"
            placeholder="ornek@mail.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={LBL} htmlFor="password">Şifre</label>
          <Input
            id="password"
            className={INP}
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {err && <p className="text-sm text-[#FB7185]">{err}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 text-white shadow-lg shadow-[#6366F1]/20"
        >
          {loading ? "Giriş yapılıyor…" : "Giriş yap"}
        </Button>
      </form>

      {/* temiz iki-link satırı (yoga app stili) */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/sifremi-unuttum" className="text-[#A39DC9] hover:text-[#C4B5FD]">
          Şifremi unuttum
        </Link>
        <Link href="/kayit" className="text-[#A78BFA] underline-offset-4 hover:underline">
          Kayıt ol
        </Link>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#2E2856]" />
        <span className="text-xs text-[#6E6796]">veya</span>
        <div className="h-px flex-1 bg-[#2E2856]" />
      </div>

      <GoogleButton onSuccess={() => router.replace("/")} onError={setErr} />
    </AuthShell>
  );
}
