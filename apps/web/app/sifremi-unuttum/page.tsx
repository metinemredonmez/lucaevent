"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const INP =
  "bg-[#171336] border-[#352E6B] text-white placeholder:text-[#6E6796] focus-visible:ring-[#8B5CF6]";

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
      /* always show the same message — no account enumeration */
    } finally {
      setDone(true);
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-3xl text-white" style={{ fontFamily: "Georgia, serif" }}>
        Şifre sıfırlama
      </h1>
      {done ? (
        <p className="mt-4 text-sm text-[#A39DC9]">
          Eğer bu e-postaya ait bir hesap varsa, şifre sıfırlama bağlantısı gönderdik. Gelen
          kutunu kontrol et.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <p className="text-sm text-[#A39DC9]">
            E-postanı gir, sana sıfırlama bağlantısı gönderelim.
          </p>
          <Input
            className={INP}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta"
            required
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 text-white shadow-lg shadow-[#6366F1]/20"
          >
            {loading ? "Gönderiliyor…" : "Bağlantı gönder"}
          </Button>
        </form>
      )}
      <p className="mt-6 text-sm">
        <Link href="/giris" className="text-[#A78BFA] hover:underline">
          ← Girişe dön
        </Link>
      </p>
    </AuthShell>
  );
}
