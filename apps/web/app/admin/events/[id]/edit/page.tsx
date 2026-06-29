"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { EventForm } from "@/components/admin/event-form";

export default function EditEvent() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [ev, setEv] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    api(`/admin/events/${id}`).then(setEv).catch((e) => setErr(e.message));
  }, [id]);

  return (
    <div>
      <Link href="/admin/events" className="text-sm text-[#6F6F6F] hover:text-[#171717]">
        ← Etkinlikler
      </Link>
      <h1
        className="mb-1 mt-2 text-3xl text-[#171717]"
        style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}
      >
        Etkinliği düzenle
      </h1>
      <p className="mb-6 text-sm text-[#6F6F6F]">{ev ? ev.title : "Yükleniyor…"}</p>

      {err && <p className="text-sm text-[#A23E48]">{err}</p>}
      {ev && <EventForm mode="edit" id={id} initial={ev} />}
    </div>
  );
}
