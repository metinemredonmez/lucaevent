"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, ShieldAlert, Loader2 } from "lucide-react";
import { verifyEmail } from "@/lib/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

const FEATURES = [
  "Hesabın doğrulanınca tüm özellikler açılır",
  "Bilet ve rezervasyon bildirimleri",
  "Güvenli giriş",
];

function VerifyInner() {
  const token = useSearchParams().get("token") || "";
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setState("error");
      return;
    }
    verifyEmail(token)
      .then(() => setState("ok"))
      .catch(() => setState("error"));
  }, [token]);

  return (
    <AuthShell headline="Son bir adım." caption="E-postanı doğrula, aramıza katıl." features={FEATURES}>
      <div className="text-center">
        {state === "loading" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#8B5CF6]/15">
              <Loader2 className="h-6 w-6 animate-spin text-[#A78BFA]" />
            </div>
            <h1 className="text-2xl text-white" style={{ fontFamily: "Georgia, serif" }}>
              Doğrulanıyor…
            </h1>
            <p className="mt-2 text-sm text-[#A39DC9]">Bir saniye, e-postanı doğruluyoruz.</p>
          </>
        )}

        {state === "ok" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#34D399]/15">
              <Check className="h-6 w-6 text-[#34D399]" />
            </div>
            <h1 className="text-2xl text-white" style={{ fontFamily: "Georgia, serif" }}>
              E-posta doğrulandı 🎉
            </h1>
            <p className="mt-2 text-sm text-[#A39DC9]">Hesabın hazır. Artık her şeyi kullanabilirsin.</p>
            <Button asChild className="mt-6 w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 text-white">
              <Link href="/">Etkinlikleri keşfet</Link>
            </Button>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FB7185]/15">
              <ShieldAlert className="h-6 w-6 text-[#FB7185]" />
            </div>
            <h1 className="text-2xl text-white" style={{ fontFamily: "Georgia, serif" }}>
              Doğrulanamadı
            </h1>
            <p className="mt-2 text-sm text-[#A39DC9]">
              Bağlantı geçersiz ya da süresi dolmuş olabilir. Giriş yapıp yeni bir doğrulama
              e-postası isteyebilirsin.
            </p>
            <Button asChild className="mt-6 w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 text-white">
              <Link href="/giris">Giriş yap</Link>
            </Button>
          </>
        )}
      </div>
    </AuthShell>
  );
}

export default function Dogrula() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
