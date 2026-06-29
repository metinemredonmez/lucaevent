import type { Metadata } from "next";
import { PageShell } from "@/components/legal/page-shell";
import { Markdown } from "@/components/markdown";
import { getPage } from "@/lib/content";

export const metadata: Metadata = {
  title: "Hakkımızda · Luca",
  description:
    "Luca; İstanbul'un sekiz dünyasını tek çatı altında buluşturan etkinlik platformu.",
};

export default async function HakkimizdaPage() {
  const page = await getPage("hakkimizda");

  if (page) {
    return (
      <PageShell
        eyebrow="Hakkımızda"
        title={page.title}
        lead={page.excerpt ?? undefined}
      >
        <Markdown content={page.content} />
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Hakkımızda"
      title="Tek çatı, sekiz dünya."
      lead="Şehrin nefes alan her anını tek bir yerde topluyoruz."
    >
      <Markdown
        content={
          "## Biz kimiz\nLuca, İstanbul'un sekiz dünyasını tek çatı altında toplar."
        }
      />
    </PageShell>
  );
}
