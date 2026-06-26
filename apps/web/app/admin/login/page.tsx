"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@luca.test");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#E3DED5] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1
            className="text-3xl text-[#171717]"
            style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}
          >
            Luca
          </h1>
          <p className="text-sm text-[#6F6F6F] mt-1">Yönetim Paneli</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#6F6F6F]">E-posta</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs text-[#6F6F6F]">Şifre</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
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
      </div>
    </div>
  );
}
