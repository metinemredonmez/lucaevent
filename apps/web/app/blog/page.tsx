import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getPosts } from "@/lib/content";
import { formatDateTR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog · Luca",
  description:
    "Luca güncesi — şehrin ritmi, etkinlik rehberleri, mekân hikâyeleri ve topluluğumuzdan kareler.",
};

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main className="pt-28 md:pt-36 pb-28">
      <div className="container max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Ana sayfa
        </Link>

        <div className="mt-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 backdrop-blur-sm px-3 py-1">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full rounded-full bg-primary opacity-60 animate-ping" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
              Blog
            </span>
          </div>
        </div>

        <h1 className="mt-5 font-serif text-3xl md:text-4xl leading-[1.05] tracking-tight text-balance font-semibold">
          Günce
        </h1>

        <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
          Şehrin ritmi, etkinlik rehberleri, mekân hikâyeleri ve topluluğumuzdan
          kareler — hepsi burada.
        </p>

        <div className="mt-10 h-px bg-border" />

        {!posts || posts.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-border bg-secondary/30 p-12 text-center">
            <p className="text-lg font-serif font-semibold">
              Henüz yazı yok. Çok yakında.
            </p>
            <p className="mt-2 text-muted-foreground">
              İlk yazılar hazırlanıyor — kısa süre sonra burada olacaklar.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition hover:border-primary/40"
            >
              Etkinlikleri keşfet <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  {post.coverUrl ? (
                    <Image
                      src={post.coverUrl}
                      alt={post.title}
                      fill
                      sizes="(min-width:640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] opacity-90" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/90 to-transparent pointer-events-none" />
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-serif text-xl font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
                    {post.title}
                  </h2>

                  {post.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {post.excerpt}
                    </p>
                  )}

                  {post.publishedAt && (
                    <div className="mt-4 pt-4 border-t border-border text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                      {formatDateTR(post.publishedAt)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
