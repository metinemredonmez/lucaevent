"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { loginUser } from "@/lib/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const INP =
  "bg-[#171336] border-[#352E6B] text-white placeholder:text-[#6E6796] focus-visible:ring-[#8B5CF6]";

export default function Giris() {
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
      await loginUser(email, password);
      router.replace("/");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-7">
        <h1 className="text-3xl text-white" style={{ fontFamily: "Georgia, serif" }}>
          Giriş yap
        </h1>
        <p className="mt-1 text-sm text-[#A39DC9]">Hesabına devam et.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-[#A39DC9]">E-posta</label>
          <Input className={INP} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-[#A39DC9]">Şifre</label>
          <div className="relative">
            <Input
              className={INP}
              type={show ? "text" : "password"}
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
          <div className="mt-1 text-right">
            <Link href="/sifremi-unuttum" className="text-xs text-[#A39DC9] hover:text-[#C4B5FD]">
              Şifremi unuttum
            </Link>
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

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#2E2856]" />
        <span className="text-xs text-[#6E6796]">veya</span>
        <div className="h-px flex-1 bg-[#2E2856]" />
      </div>

      <GoogleButton onSuccess={() => router.replace("/")} onError={setErr} />

      <p className="mt-6 text-center text-sm text-[#A39DC9]">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="text-[#A78BFA] hover:underline">
          Kayıt ol
        </Link>
      </p>
    </AuthShell>
  );
}
