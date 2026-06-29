"use client";

import Link from "next/link";
import { EventForm } from "@/components/admin/event-form";

export default function NewEvent() {
  return (
    <div>
      <Link href="/admin/events" className="text-sm text-muted-foreground hover:text-foreground">
        ← Etkinlikler
      </Link>
      <h1
        className="mb-1 mt-2 text-3xl text-foreground"
        style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}
      >
        Yeni etkinlik
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">Temel bilgileri gir, sonra yayınla.</p>
      <EventForm mode="create" />
    </div>
  );
}
