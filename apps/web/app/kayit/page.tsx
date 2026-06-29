"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check } from "lucide-react";
import { registerUser, passwordScore } from "@/lib/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const INP =
  "bg-[#171336] border-[#352E6B] text-white placeholder:text-[#6E6796] focus-visible:ring-[#8B5CF6]";
const STRENGTH = ["Çok zayıf", "Zayıf", "Orta", "İyi", "Güçlü"];
const STRENGTH_COLOR = ["#FB7185", "#FB7185", "#FBBF24", "#A3E635", "#34D399"];

export default function Kayit() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [kvkk, setKvkk] = useState(false);
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const score = passwordScore(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (password.length < 8) return setErr("Şifre en az 8 karakter olmalı.");
    if (score < 2) return setErr("Daha güçlü bir şifre seç (harf + rakam).");
    if (!kvkk) return setErr("KVKK aydınlatma metnini onaylaman gerekiyor.");
    if (!terms) return setErr("Kullanım koşullarını onaylaman gerekiyor.");
    setLoading(true);
    try {
      await registerUser({
        name: name || undefined,
        email,
        password,
        kvkkConsent: kvkk,
        termsAccepted: terms,
        marketingOptIn: marketing,
      });
      setDone(true);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#34D399]/15">
            <Check className="h-6 w-6 text-[#34D399]" />
          </div>
          <h1 className="text-2xl text-white" style={{ fontFamily: "Georgia, serif" }}>
            Hoş geldin!
          </h1>
          <p className="mt-2 text-sm text-[#A39DC9]">
            Hesabın oluşturuldu. <b className="text-white">{email}</b> adresine doğrulama e-postası gönderdik.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm text-[#A78BFA] hover:underline">
            Ana sayfaya dön
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mb-6">
        <h1 className="text-3xl text-white" style={{ fontFamily: "Georgia, serif" }}>
          Luca'ya katıl
        </h1>
        <p className="mt-1 text-sm text-[#A39DC9]">Etkinlikleri keşfet, biletini al.</p>
      </div>

      <GoogleButton onSuccess={() => router.replace("/")} onError={setErr} />
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#2E2856]" />
        <span className="text-xs text-[#6E6796]">veya e-posta ile</span>
        <div className="h-px flex-1 bg-[#2E2856]" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs text-[#A39DC9]">Ad Soyad</label>
            <Input className={INP} value={name} onChange={(e) => setName(e.target.value)} placeholder="Adın" />
          </div>
          <div>
            <label className="text-xs text-[#A39DC9]">E-posta</label>
            <Input className={INP} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className="text-xs text-[#A39DC9]">Şifre</label>
          <div className="relative">
            <Input
              className={INP}
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 8 karakter"
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
          {password && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-[#2E2856]">
                <div
                  className="h-full transition-all"
                  style={{ width: `${(score / 4) * 100}%`, background: STRENGTH_COLOR[score] }}
                />
              </div>
              <span className="mt-1 inline-block text-xs" style={{ color: STRENGTH_COLOR[score] }}>
                {STRENGTH[score]}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-1">
          <Consent checked={kvkk} onChange={setKvkk}>
            <Link href="/kvkk" target="_blank" className="text-[#A78BFA] hover:underline">
              KVKK aydınlatma metnini
            </Link>{" "}
            okudum, onaylıyorum. <span className="text-[#FB7185]">*</span>
          </Consent>
          <Consent checked={terms} onChange={setTerms}>
            <Link href="/kosullar" target="_blank" className="text-[#A78BFA] hover:underline">
              Kullanım koşullarını
            </Link>{" "}
            kabul ediyorum. <span className="text-[#FB7185]">*</span>
          </Consent>
          <Consent checked={marketing} onChange={setMarketing}>
            Kampanya ve etkinliklerden haberdar olmak istiyorum. (opsiyonel)
          </Consent>
        </div>

        {err && <p className="text-sm text-[#FB7185]">{err}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 text-white shadow-lg shadow-[#6366F1]/20"
        >
          {loading ? "Kayıt olunuyor…" : "Hesap oluştur"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-[#A39DC9]">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="text-[#A78BFA] hover:underline">
          Giriş yap
        </Link>
      </p>
    </AuthShell>
  );
}

function Consent({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-xs text-[#A39DC9]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[#8B5CF6]"
      />
      <span>{children}</span>
    </label>
  );
}
