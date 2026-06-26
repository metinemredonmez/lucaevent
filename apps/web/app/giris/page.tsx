"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { loginUser } from "@/lib/session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#E3DED5] bg-white p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl text-[#171717]" style={{ fontFamily: "Georgia, serif" }}>
            Giriş yap
          </h1>
          <p className="text-sm text-[#6F6F6F] mt-1">Hesabına devam et.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#6F6F6F]">E-posta</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-[#6F6F6F]">Şifre</label>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6F6F]"
                tabIndex={-1}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="text-right mt-1">
              <Link href="/sifremi-unuttum" className="text-xs text-[#6F6F6F] hover:text-[#C86B42]">
                Şifremi unuttum
              </Link>
            </div>
          </div>

          {err && <p className="text-sm text-[#A23E48]">{err}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C86B42] hover:bg-[#b35c36] text-white"
          >
            {loading ? "Giriş yapılıyor…" : "Giriş yap"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[#6F6F6F]">
          Hesabın yok mu?{" "}
          <Link href="/kayit" className="text-[#C86B42] hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}
