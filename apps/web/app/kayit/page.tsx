"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Check } from "lucide-react";
import { registerUser, passwordScore } from "@/lib/session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STRENGTH = ["Çok zayıf", "Zayıf", "Orta", "İyi", "Güçlü"];
const STRENGTH_COLOR = ["#A23E48", "#A23E48", "#B5852A", "#657257", "#3A7D5B"];

export default function Kayit() {
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
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#E3DED5] bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#657257]/15">
            <Check className="h-6 w-6 text-[#3A7D5B]" />
          </div>
          <h1 className="text-2xl text-[#171717]" style={{ fontFamily: "Georgia, serif" }}>
            Hoş geldin!
          </h1>
          <p className="mt-2 text-sm text-[#6F6F6F]">
            Hesabın oluşturuldu. <b>{email}</b> adresine doğrulama e-postası gönderdik.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm text-[#C86B42] hover:underline">
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#E3DED5] bg-white p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl text-[#171717]" style={{ fontFamily: "Georgia, serif" }}>
            Luca'ya katıl
          </h1>
          <p className="text-sm text-[#6F6F6F] mt-1">Etkinlikleri keşfet, biletini al.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#6F6F6F]">Ad Soyad</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Adın" />
          </div>
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
                placeholder="En az 8 karakter"
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
            {password && (
              <div className="mt-2">
                <div className="h-1.5 rounded-full bg-[#E3DED5] overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${(score / 4) * 100}%`, background: STRENGTH_COLOR[score] }}
                  />
                </div>
                <span className="text-xs mt-1 inline-block" style={{ color: STRENGTH_COLOR[score] }}>
                  {STRENGTH[score]}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <Consent checked={kvkk} onChange={setKvkk}>
              <Link href="/kvkk" target="_blank" className="text-[#C86B42] hover:underline">
                KVKK aydınlatma metnini
              </Link>{" "}
              okudum, kişisel verilerimin işlenmesini onaylıyorum. <span className="text-[#A23E48]">*</span>
            </Consent>
            <Consent checked={terms} onChange={setTerms}>
              <Link href="/kosullar" target="_blank" className="text-[#C86B42] hover:underline">
                Kullanım koşullarını
              </Link>{" "}
              kabul ediyorum. <span className="text-[#A23E48]">*</span>
            </Consent>
            <Consent checked={marketing} onChange={setMarketing}>
              Kampanya ve etkinliklerden e-posta ile haberdar olmak istiyorum. (opsiyonel)
            </Consent>
          </div>

          {err && <p className="text-sm text-[#A23E48]">{err}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C86B42] hover:bg-[#b35c36] text-white"
          >
            {loading ? "Kayıt olunuyor…" : "Hesap oluştur"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[#6F6F6F]">
          Zaten hesabın var mı?{" "}
          <Link href="/giris" className="text-[#C86B42] hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
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
    <label className="flex items-start gap-2 text-xs text-[#6F6F6F] cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[#C86B42]"
      />
      <span>{children}</span>
    </label>
  );
}
