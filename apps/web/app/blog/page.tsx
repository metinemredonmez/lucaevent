import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/legal/page-shell";

export const metadata: Metadata = {
  title: "Blog · Luca",
  description: "Luca blog çok yakında — şehrin ritmi, etkinlik rehberleri ve topluluk hikâyeleri.",
};

export default function BlogPage() {
  return (
    <PageShell
      eyebrow="Blog"
      title="Blog çok yakında."
      lead="Şehrin ritmi, etkinlik rehberleri, mekân hikâyeleri ve topluluğumuzdan kareler — hepsi burada toplanacak. Hazırlıyoruz."
    >
      <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center">
        <p className="text-muted-foreground">
          İlk yazılar yayına girdiğinde ilk senin haberin olsun — üye ol, ilgi alanlarını seç,
          bültenimize otomatik dahil ol.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/kayit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Üye ol <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition hover:border-primary/40"
          >
            Etkinlikleri keşfet
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
