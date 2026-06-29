"use client";

import Link from "next/link";
import { EventForm } from "@/components/admin/event-form";

export default function NewEvent() {
  return (
    <div>
      <Link href="/admin/events" className="text-sm text-[#6F6F6F] hover:text-[#171717]">
        ← Etkinlikler
      </Link>
      <h1
        className="mb-1 mt-2 text-3xl text-[#171717]"
        style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}
      >
        Yeni etkinlik
      </h1>
      <p className="mb-6 text-sm text-[#6F6F6F]">Temel bilgileri gir, sonra yayınla.</p>
      <EventForm mode="create" />
    </div>
  );
}
