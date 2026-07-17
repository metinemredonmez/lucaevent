"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { forgotPassword } from "@/lib/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const INP =
  "bg-[#171336] border-[#352E6B] text-white placeholder:text-[#6E6796] focus-visible:ring-[#22c9b8]";

const RESET_FEATURES = [
  "E-postana güvenli sıfırlama bağlantısı",
  "Bağlantı 1 saat geçerli kalır",
  "Hesabın ve verilerin güvende",
];

export default function SifremiUnuttum() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  async function send() {
    setLoading(true);
    try {
      await forgotPassword(email);
    } catch {
      /* hesap sızıntısı olmasın diye her zaman aynı mesaj */
    } finally {
      setDone(true);
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await send();
  }

  return (
    <AuthShell
      headline="Şifreni mi unuttun? Sorun değil."
      caption="Birkaç saniyede sıfırla, kaldığın yerden devam et."
      features={RESET_FEATURES}
    >
      {done ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#22c9b8]/15">
            <MailCheck className="h-6 w-6 text-[#22c9b8]" />
          </div>
          <h1 className="text-2xl text-white" style={{ fontFamily: "Georgia, serif" }}>
            Bağlantıyı gönderdik
          </h1>
          <p className="mt-2 text-sm text-[#A39DC9]">
            Eğer <b className="text-white">{email || "bu e-posta"}</b> bir hesaba bağlıysa,
            şifre sıfırlama bağlantısını gönderdik. Gelen kutunu (ve spam'i) kontrol et.
          </p>
          <div className="mt-6 space-y-3">
            <button
              type="button"
              disabled={resent || loading}
              onClick={async () => { await send(); setResent(true); }}
              className="text-sm text-[#22c9b8] hover:underline disabled:opacity-50"
            >
              {resent ? "Tekrar gönderildi ✓" : "E-posta gelmedi mi? Tekrar gönder"}
            </button>
            <div>
              <Link href="/giris" className="text-sm text-[#A39DC9] hover:text-white">
                ← Girişe dön
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-3xl text-white" style={{ fontFamily: "Georgia, serif" }}>
            Şifre sıfırlama
          </h1>
          <p className="mt-1 text-sm text-[#A39DC9]">
            Hesabının e-postasını gir, sana güvenli bir sıfırlama bağlantısı gönderelim.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs text-[#A39DC9]">E-posta</label>
              <Input
                className={INP}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                required
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#0e9a8c] to-[#22c9b8] hover:opacity-90 text-white shadow-lg shadow-[#0e9a8c]/20"
            >
              {loading ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
            </Button>
          </form>
          <p className="mt-6 text-sm">
            <Link href="/giris" className="text-[#22c9b8] hover:underline">← Girişe dön</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
