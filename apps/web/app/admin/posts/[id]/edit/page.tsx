"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ContentForm } from "@/components/admin/content-form";

export default function EditPost() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [post, setPost] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    api(`/admin/posts/${id}`).then(setPost).catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <p className="text-sm text-destructive">{err}</p>;
  if (!post) return <p className="text-sm text-muted-foreground">Yükleniyor…</p>;

  return (
    <div>
      <AdminPageHeader title="Yazıyı düzenle" subtitle={post.title} />
      <ContentForm kind="post" mode="edit" id={id} initial={post} />
    </div>
  );
}
