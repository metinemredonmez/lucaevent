import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell, Section } from "@/components/legal/page-shell";
import { CATEGORIES } from "@/lib/data";

export const metadata: Metadata = {
  title: "Hakkımızda · Luca",
  description:
    "Luca; wellness, gezi, spor, atölye, sosyal, yeme-içme, iş ve gece — İstanbul'un sekiz dünyasını tek çatı altında buluşturan etkinlik platformu.",
};

export default function HakkimizdaPage() {
  return (
    <PageShell
      eyebrow="Hakkımızda"
      title="Tek çatı, sekiz dünya."
      lead="Luca; gece kulübünden ibaret değil. Şehrin nefes alan her anını — sabah yogasından tekne turuna, seramik atölyesinden çatı katı konserine — tek bir yerde topluyoruz."
    >
      <Section n="01" title="Biz kimiz">
        <p>
          Luca, İstanbul'da yaşamı bir “çıkılacak tek bir gece” olmaktan çıkarıp bütün bir
          haftaya yayan bir etkinlik ve topluluk platformudur. Amacımız basit: doğru anı,
          doğru insanlarla, doğru yerde bir araya getirmek.
        </p>
        <p>
          İnsanlar bir etkinliğe sadece bilet için gelmez; bir his, bir ritim ve bir
          topluluk için gelir. Biz de etkinlikleri buna göre seçer, küratörlüğünü yapar ve
          tek bir akışta sunarız.
        </p>
      </Section>

      <Section n="02" title="Sekiz dünya">
        <p>Luca, sekiz dikey etrafında kurulu — her biri kendi ritmiyle akar:</p>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <li key={c.slug} className="flex items-center gap-2.5 text-foreground/85">
              <span aria-hidden>{c.emoji}</span>
              <span>{c.name}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section n="03" title="Nasıl çalışır">
        <p>
          Üye ol, ilgi alanlarını seç; sana uygun etkinlikler akışına düşsün. Yerini ayır,
          biletini al, kapıda QR ile saniyeler içinde içeri gir. Favorilerini takip et,
          topluluğa katıl, kaçırma.
        </p>
      </Section>

      <Section n="04" title="Birlikte büyüyelim">
        <p>
          Bir etkinliğin mi var, mekânını mı tanıtmak istiyorsun, yoksa bir fikir mi
          paylaşacaksın? Kapımız açık.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/basvuru"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Bize ulaş <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/kayit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition hover:border-primary/40"
          >
            Üye ol
          </Link>
        </div>
      </Section>
    </PageShell>
  );
}
