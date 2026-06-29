"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ContentForm } from "@/components/admin/content-form";

export default function EditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [page, setPage] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    api(`/admin/pages/${id}`)
      .then(setPage)
      .catch((e) => setErr(e.message));
  }, [id]);

  if (err) {
    return (
      <div>
        <AdminPageHeader title="Sayfayı düzenle" />
        <p className="text-sm text-destructive">{err}</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div>
        <AdminPageHeader title="Sayfayı düzenle" subtitle="Yükleniyor…" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title="Sayfayı düzenle" subtitle={page.title} />
      <ContentForm kind="page" mode="edit" id={id} initial={page} />
    </div>
  );
}
