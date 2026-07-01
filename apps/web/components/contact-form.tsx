"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSubmission, type SubmissionBody } from "@/lib/session";

const SUBJECTS = [
  "Genel",
  "Etkinlik önerisi",
  "İş birliği / sponsorluk",
  "Medya / basın",
  "KVKK / gizlilik",
];

/** İletişim formu — /submissions API'sine gerçekten POST atar (admin panelinden okunur). */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) return setErr("Adını yaz.");
    if (!email.trim()) return setErr("E-posta yaz.");
    if (!message.trim()) return setErr("Mesajını yaz.");
    const body: SubmissionBody = {
      type: "CONTACT",
      name: name.trim(),
      email: email.trim(),
      subject,
      message: message.trim(),
    };
    setLoading(true);
    try {
      await createSubmission(body);
      setDone(true);
    } catch (e: any) {
      setErr(e?.message || "Gönderilemedi, tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="size-6" />
        </div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          Aldık, teşekkürler!
        </h2>
        <p className="mt-2 text-muted-foreground">
          Mesajın bize ulaştı. En kısa sürede dönüş yapacağız.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setDone(false);
            setName("");
            setEmail("");
            setSubject(SUBJECTS[0]);
            setMessage("");
          }}
        >
          Yeni mesaj
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground mb-2">
        01 / Form
      </div>
      <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">
        Bize bir mesaj bırak
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Ad Soyad
          </label>
          <Input
            className="mt-2"
            placeholder="Adını yaz"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            E-posta
          </label>
          <Input
            type="email"
            className="mt-2"
            placeholder="ornek@eposta.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Konu
        </label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Mesajın
        </label>
        <textarea
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Bir şey soracak mısın, paylaşmak ister misin?"
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button size="lg" type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Gönderiliyor…" : "Mesajı gönder"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Gönderdiğin bilgiler yalnız bu konuyu cevaplamak için kullanılır. Detay için{" "}
        <Link className="underline hover:text-primary" href="/kvkk">
          KVKK aydınlatma metni
        </Link>
        .
      </p>
    </form>
  );
}
