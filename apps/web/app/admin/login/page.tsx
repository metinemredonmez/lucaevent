"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { login } from "@/lib/api";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const INP =
  "bg-[#171336] border-[#352E6B] text-white placeholder:text-[#6E6796] focus-visible:ring-[#8B5CF6]";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/admin");
    } catch (e: any) {
      setErr(e.message || "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      caption="Luca — Yönetim Paneli"
      headline="Etkinliklerini tek panelden yönet."
      features={[
        "Etkinlik, bilet ve kontenjan yönetimi",
        "Satış ve doluluk istatistikleri",
        "QR ile kapı check-in",
      ]}
    >
      <div className="mb-7">
        <h1 className="text-3xl text-white" style={{ fontFamily: "Georgia, serif" }}>
          Yönetim girişi
        </h1>
        <p className="mt-1 text-sm text-[#A39DC9]">Personel hesabınla devam et.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="admin-email" className="text-xs text-[#A39DC9]">E-posta</label>
          <Input
            id="admin-email"
            name="email"
            className={INP}
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder="ornek@lucaclub.com.tr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="admin-password" className="text-xs text-[#A39DC9]">Şifre</label>
          <div className="relative">
            <Input
              id="admin-password"
              name="password"
              className={INP}
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6796]"
              tabIndex={-1}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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
      <p className="mt-4 text-center text-sm">
        <Link href="/sifremi-unuttum" className="text-[#A78BFA] hover:underline">
          Şifremi unuttum
        </Link>
      </p>
    </AuthShell>
  );
}
