"use client";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ContentForm } from "@/components/admin/content-form";

export default function NewPage() {
  return (
    <div>
      <AdminPageHeader title="Yeni sayfa" subtitle="Yeni bir içerik sayfası oluştur" />
      <ContentForm kind="page" mode="create" />
    </div>
  );
}
