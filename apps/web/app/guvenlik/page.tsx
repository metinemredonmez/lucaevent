import type { Metadata } from "next";
import { PageShell } from "@/components/legal/page-shell";
import { Markdown } from "@/components/markdown";
import { getPage } from "@/lib/content";

export const metadata: Metadata = {
  title: "Güvenlik · Luca",
  description:
    "Hesap güvenliği, ödeme güvenliği ve veri koruma — Luca'da bilgilerini nasıl koruyoruz.",
};

const FALLBACK = `## Hesap güvenliği
Şifreler sunucularımızda asla düz metin tutulmaz; argon2 ile özetlenerek saklanır. Oturumlar kısa ömürlü güvenli jetonlarla yönetilir ve şifreni değiştirdiğinde diğer oturumlar otomatik kapatılır.

## Ödeme güvenliği
Tüm trafik SSL/TLS ile şifrelenir. Kart bilgilerin Luca sunucularında saklanmaz; ödemeler lisanslı ödeme kuruluşu altyapısı ve 3D Secure üzerinden alınır.

## Veri ve gizlilik
Kişisel verilerini yalnızca hizmeti sunmak için, KVKK'ya uygun şekilde işleriz. İstediğin an hesabını ve verilerini silme hakkına sahipsin.`;

export default async function GuvenlikPage() {
  const page = await getPage("guvenlik");

  if (page) {
    return (
      <PageShell eyebrow="Güvenlik" title={page.title} lead={page.excerpt ?? undefined}>
        <Markdown content={page.content} />
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Güvenlik"
      title="Güvenliğin bizim için öncelik."
      lead="Hesabını, ödemelerini ve kişisel verilerini korumak için sektör standardı önlemler alıyoruz."
    >
      <Markdown content={FALLBACK} />
    </PageShell>
  );
}
