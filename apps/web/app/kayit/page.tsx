"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { registerUser, passwordScore } from "@/lib/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/data";

const INP =
  "bg-[#171336] border-[#352E6B] text-white placeholder:text-[#6E6796] focus-visible:ring-[#8B5CF6]";
const STRENGTH = ["Çok zayıf", "Zayıf", "Orta", "İyi", "Güçlü"];
const STRENGTH_COLOR = ["#FB7185", "#FB7185", "#FBBF24", "#A3E635", "#34D399"];
const STEPS = ["Hesap", "Profil", "İlgi alanları"];

const REGISTER_FEATURES = [
  "Yoga, kamp, tekne, atölye, gece — hepsi tek üyelikte",
  "İlgi alanına göre kişisel öneriler",
  "Tek tıkla bilet, QR ile giriş",
];

export default function Kayit() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // step 1 — hesap
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  // step 2 — profil
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // step 3 — ilgi + onay
  const [interests, setInterests] = useState<string[]>([]);
  const [kvkk, setKvkk] = useState(false);
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const score = passwordScore(password);

  function validateStep0(): string | null {
    if (!email) return "E-posta gir.";
    if (password.length < 8) return "Şifre en az 8 karakter olmalı.";
    if (score < 2) return "Daha güçlü bir şifre seç (harf + rakam).";
    if (password !== confirm) return "Şifreler eşleşmiyor.";
    return null;
  }

  function toggleInterest(slug: string) {
    setInterests((cur) =>
      cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug],
    );
  }

  async function handlePrimary(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (step === 0) {
      const v = validateStep0();
      if (v) return setErr(v);
      return setStep(1);
    }
    if (step === 1) return setStep(2);

    // step 2 → submit
    if (!kvkk) return setErr("KVKK aydınlatma metnini onaylaman gerekiyor.");
    if (!terms) return setErr("Kullanım koşullarını onaylaman gerekiyor.");
    setLoading(true);
    try {
      await registerUser({
        name: name || undefined,
        email,
        password,
        phone: phone || undefined,
        city: city || undefined,
        birthDate: birthDate || undefined,
        interests: interests.length ? interests : undefined,
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
      <AuthShell features={REGISTER_FEATURES}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#34D399]/15">
            <Check className="h-6 w-6 text-[#34D399]" />
          </div>
          <h1 className="text-2xl text-white" style={{ fontFamily: "Georgia, serif" }}>
            Hoş geldin!
          </h1>
          <p className="mt-2 text-sm text-[#A39DC9]">
            Hesabın oluşturuldu. <b className="text-white">{email}</b> adresine doğrulama
            e-postası gönderdik — kutunu kontrol et.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={() => router.replace("/")}
              className="w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 text-white"
            >
              Etkinlikleri keşfet
            </Button>
            <Link href="/giris" className="text-sm text-[#A78BFA] hover:underline">
              Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  const lastStep = step === STEPS.length - 1;

  return (
    <AuthShell features={REGISTER_FEATURES}>
      <div className="mb-5">
        <h1 className="text-3xl text-white" style={{ fontFamily: "Georgia, serif" }}>
          Luca'ya katıl
        </h1>
        <p className="mt-1 text-sm text-[#A39DC9]">
          Birkaç adımda hesabın hazır — sana göre öneriler için.
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <div
              className="h-1 rounded-full transition-colors"
              style={{ background: i <= step ? "#8B5CF6" : "#2E2856" }}
            />
            <span
              className="text-[10px] font-medium uppercase tracking-wider transition-colors"
              style={{ color: i === step ? "#C4B5FD" : "#6E6796" }}
            >
              {i + 1}. {label}
            </span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <>
          <GoogleButton onSuccess={() => router.replace("/")} onError={setErr} />
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#2E2856]" />
            <span className="text-xs text-[#6E6796]">veya e-posta ile</span>
            <div className="h-px flex-1 bg-[#2E2856]" />
          </div>
        </>
      )}

      <form onSubmit={handlePrimary} className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-4"
          >
            {/* ───────── STEP 1 — HESAP ───────── */}
            {step === 0 && (
              <>
                <Field label="Ad Soyad">
                  <Input className={INP} value={name} onChange={(e) => setName(e.target.value)} placeholder="Adın" />
                </Field>
                <Field label="E-posta">
                  <Input className={INP} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" required />
                </Field>
                <Field label="Şifre">
                  <div className="relative">
                    <Input
                      className={INP}
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="En az 8 karakter"
                      required
                    />
                    <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6796]" tabIndex={-1}>
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#2E2856]">
                        <div className="h-full transition-all" style={{ width: `${(score / 4) * 100}%`, background: STRENGTH_COLOR[score] }} />
                      </div>
                      <span className="mt-1 inline-block text-xs" style={{ color: STRENGTH_COLOR[score] }}>{STRENGTH[score]}</span>
                    </div>
                  )}
                </Field>
                <Field label="Şifre (tekrar)">
                  <Input
                    className={INP}
                    type={show ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Şifreni tekrar gir"
                    required
                  />
                  {confirm && confirm !== password && (
                    <span className="mt-1 inline-block text-xs text-[#FB7185]">Şifreler eşleşmiyor.</span>
                  )}
                </Field>
              </>
            )}

            {/* ───────── STEP 2 — PROFİL ───────── */}
            {step === 1 && (
              <>
                <p className="text-xs text-[#6E6796]">
                  Bu bilgiler opsiyonel — sana daha iyi öneriler ve etkinlik hatırlatmaları için.
                </p>
                <Field label="Telefon (opsiyonel)">
                  <Input className={INP} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5__ ___ __ __" />
                </Field>
                <Field label="Şehir (opsiyonel)">
                  <Input className={INP} value={city} onChange={(e) => setCity(e.target.value)} placeholder="İstanbul" />
                </Field>
                <Field label="Doğum tarihi (opsiyonel)">
                  <Input className={INP} type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </Field>
              </>
            )}

            {/* ───────── STEP 3 — İLGİ + ONAY ───────── */}
            {step === 2 && (
              <>
                <div>
                  <p className="text-sm text-[#A39DC9]">Neler ilgini çekiyor?</p>
                  <p className="mb-3 text-xs text-[#6E6796]">Sana göre etkinlikler önerelim (opsiyonel).</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => {
                      const on = interests.includes(c.slug);
                      return (
                        <button
                          key={c.slug}
                          type="button"
                          onClick={() => toggleInterest(c.slug)}
                          className="rounded-full border px-3 py-1.5 text-xs transition-colors"
                          style={{
                            borderColor: on ? "#8B5CF6" : "#352E6B",
                            background: on ? "rgba(139,92,246,0.18)" : "transparent",
                            color: on ? "#E9E5FF" : "#A39DC9",
                          }}
                        >
                          {c.emoji} {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#2E2856] pt-4">
                  <Consent checked={kvkk} onChange={setKvkk}>
                    <Link href="/kvkk" target="_blank" className="text-[#A78BFA] hover:underline">KVKK aydınlatma metnini</Link>{" "}
                    okudum, onaylıyorum. <span className="text-[#FB7185]">*</span>
                  </Consent>
                  <Consent checked={terms} onChange={setTerms}>
                    <Link href="/kosullar" target="_blank" className="text-[#A78BFA] hover:underline">Kullanım koşullarını</Link>{" "}
                    kabul ediyorum. <span className="text-[#FB7185]">*</span>
                  </Consent>
                  <Consent checked={marketing} onChange={setMarketing}>
                    Kampanya ve etkinliklerden haberdar olmak istiyorum. (opsiyonel)
                  </Consent>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {err && <p className="text-sm text-[#FB7185]">{err}</p>}

        {/* Navigation */}
        <div className="flex items-center gap-2 pt-1">
          {step > 0 && (
            <Button
              type="button"
              onClick={() => { setErr(""); setStep((s) => s - 1); }}
              className="flex-1 border border-[#352E6B] bg-transparent text-[#A39DC9] hover:bg-white/[0.04]"
            >
              <ArrowLeft className="h-4 w-4" /> Geri
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="flex-[2] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 text-white shadow-lg shadow-[#6366F1]/20"
          >
            {loading
              ? "Kayıt olunuyor…"
              : lastStep
                ? "Hesap oluştur"
                : (<>Devam <ArrowRight className="h-4 w-4" /></>)}
          </Button>
        </div>

        {step === 1 && (
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full text-center text-xs text-[#6E6796] hover:text-[#A39DC9]"
          >
            Bu adımı atla →
          </button>
        )}
      </form>

      <p className="mt-5 text-center text-sm text-[#A39DC9]">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="text-[#A78BFA] hover:underline">Giriş yap</Link>
      </p>
    </AuthShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-[#A39DC9]">{label}</label>
      {children}
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
