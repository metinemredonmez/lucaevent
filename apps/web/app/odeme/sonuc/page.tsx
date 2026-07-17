import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Ödeme Sonucu · Luca" };

export default async function OdemeSonuc({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; kod?: string }>;
}) {
  const { durum, kod } = await searchParams;
  const ok = durum === "basarili";

  return (
    <main className="grid min-h-screen place-items-center px-4 py-24">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <div
          className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
          style={{
            background: ok ? "hsl(var(--success) / 0.12)" : "hsl(var(--destructive) / 0.1)",
            color: ok ? "hsl(var(--success))" : "hsl(var(--destructive))",
          }}
        >
          {ok ? <CheckCircle2 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
        </div>

        <h1 className="mt-5 font-serif text-2xl font-semibold">
          {ok ? "Ödeme başarılı" : "Ödeme tamamlanamadı"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ok
            ? "Biletlerin hazır. E-postana onay gönderdik; biletlerini hesabından da görebilirsin."
            : durum === "hata"
            ? "Ödeme sırasında bir sorun oluştu. Tutar tahsil edilmediyse tekrar deneyebilirsin."
            : "Ödeme onaylanmadı. Kart bilgilerini kontrol edip tekrar deneyebilirsin."}
        </p>
        {kod && (
          <p className="mt-3 font-mono text-xs text-muted-foreground/70">Sipariş: {kod}</p>
        )}

        <div className="mt-7 flex flex-col gap-2.5">
          {ok ? (
            <Link
              href="/hesap"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0e9a8c] to-[#22c9b8] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Biletlerim <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0e9a8c] to-[#22c9b8] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Etkinliklere dön <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <Link
            href="/"
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Ana sayfa
          </Link>
        </div>
      </div>
    </main>
  );
}
