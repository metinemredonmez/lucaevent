"use client";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ContentForm } from "@/components/admin/content-form";

export default function NewPostPage() {
  return (
    <div>
      <AdminPageHeader title="Yeni yazı" subtitle="Yeni bir blog yazısı oluştur" />
      <ContentForm kind="post" mode="create" />
    </div>
  );
}
