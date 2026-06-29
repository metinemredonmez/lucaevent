import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getPost, getPosts } from "@/lib/content";
import { PageShell } from "@/components/legal/page-shell";
import { Markdown } from "@/components/markdown";
import { formatDateTR } from "@/lib/utils";

export async function generateStaticParams() {
  const posts = await getPosts();
  return (posts ?? []).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return { title: post ? `${post.title} · Luca` : "Blog · Luca" };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <PageShell
      eyebrow="Blog"
      title={post.title}
      lead={post.excerpt ?? undefined}
      updatedAt={post.publishedAt ? formatDateTR(post.publishedAt) : undefined}
    >
      {post.coverUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border">
          <Image
            src={post.coverUrl}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      <Markdown content={post.content} />
    </PageShell>
  );
}
