"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SifremiUnuttum() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
    } catch {
      /* never reveal — always show the same message */
    } finally {
      setDone(true);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#E3DED5] bg-white p-8">
        <h1 className="text-2xl text-[#171717] text-center" style={{ fontFamily: "Georgia, serif" }}>
          Şifre sıfırlama
        </h1>
        {done ? (
          <p className="mt-4 text-sm text-[#6F6F6F] text-center">
            Eğer bu e-postaya ait bir hesap varsa, şifre sıfırlama bağlantısı gönderdik.
            Gelen kutunu kontrol et.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <p className="text-sm text-[#6F6F6F]">
              E-postanı gir, sana sıfırlama bağlantısı gönderelim.
            </p>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta"
              required
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C86B42] hover:bg-[#b35c36] text-white"
            >
              {loading ? "Gönderiliyor…" : "Bağlantı gönder"}
            </Button>
          </form>
        )}
        <p className="mt-5 text-center text-sm">
          <Link href="/giris" className="text-[#C86B42] hover:underline">
            Girişe dön
          </Link>
        </p>
      </div>
    </div>
  );
}
