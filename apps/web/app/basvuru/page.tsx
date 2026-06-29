"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CalendarPlus, Users, Check } from "lucide-react";
import { Nav } from "@/components/nav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSubmission, type SubmissionBody } from "@/lib/session";
import { CATEGORIES } from "@/lib/data";

type Tab = "CONTACT" | "EVENT_PROPOSAL" | "MEMBERSHIP";

const TABS: { type: Tab; label: string; icon: typeof Mail; desc: string }[] = [
  { type: "CONTACT", label: "İletişim", icon: Mail, desc: "Soru, öneri, geri bildirim" },
  { type: "EVENT_PROPOSAL", label: "Etkinlik Öner", icon: CalendarPlus, desc: "Etkinlik fikri / organizatörlük" },
  { type: "MEMBERSHIP", label: "Üyelik", icon: Users, desc: "Topluluğa katıl" },
];

const INP =
  "bg-[#171336] border-[#352E6B] text-white placeholder:text-[#6E6796] focus-visible:ring-[#8B5CF6]";
const LBL = "block text-xs text-[#A39DC9] mb-1";

export default function BasvuruPage() {
  const [tab, setTab] = useState<Tab>("CONTACT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  function toggleInterest(slug: string) {
    setInterests((c) => (c.includes(slug) ? c.filter((s) => s !== slug) : [...c, slug]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) return setErr("Adını gir.");
    if (!email.trim()) return setErr("E-posta gir.");
    const body: SubmissionBody = { type: tab, name: name.trim(), email: email.trim() };
    if (phone) body.phone = phone.trim();
    if (subject) body.subject = subject.trim();
    if (message) body.message = message.trim();
    if (tab === "MEMBERSHIP" && interests.length) body.payload = { interests };
    setLoading(true);
    try {
      await createSubmission(body);
      setDone(true);
    } catch (e: any) {
      setErr(e.message || "Gönderilemedi, tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  const active = TABS.find((t) => t.type === tab)!;

  return (
    <>
      <Nav />
      <main className="relative min-h-screen overflow-hidden bg-[#0C0920] pt-16">
        {/* atmosfer */}
        <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#7C3AED]/20 blur-[120px]" />
        <div className="pointer-events-none absolute right-[-6rem] top-1/3 h-96 w-96 rounded-full bg-[#A855F7]/15 blur-[130px]" />

        <div className="container relative z-10 mx-auto max-w-xl px-4 pb-16 pt-8">
          <div className="mb-7 text-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#A78BFA]">
              Luca · İletişim
            </span>
            <h1 className="mt-3 font-serif text-3xl text-white md:text-4xl">Bize ulaş</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#A39DC9]">
              Soru sor, etkinlik öner ya da topluluğa katıl — hepsi tek yerden.
            </p>
          </div>

          {/* sekmeler */}
          <div className="mb-6 grid grid-cols-3 gap-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const on = tab === t.type;
              return (
                <button
                  key={t.type}
                  onClick={() => { setTab(t.type); setErr(""); }}
                  className="relative rounded-xl border p-3 text-center transition-colors"
                  style={{
                    borderColor: on ? "#8B5CF6" : "#2E2856",
                    background: on ? "rgba(139,92,246,0.14)" : "rgba(255,255,255,0.02)",
                  }}
                >
                  <Icon className="mx-auto h-5 w-5" style={{ color: on ? "#C4B5FD" : "#6E6796" }} />
                  <span className="mt-1.5 block text-xs" style={{ color: on ? "#E9E5FF" : "#A39DC9" }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 backdrop-blur-md">
            {done ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#34D399]/15">
                  <Check className="h-6 w-6 text-[#34D399]" />
                </div>
                <h2 className="font-serif text-2xl text-white">Aldık, teşekkürler!</h2>
                <p className="mt-2 text-sm text-[#A39DC9]">
                  Başvurun bize ulaştı. En kısa sürede dönüş yapacağız.
                </p>
                <Button
                  onClick={() => { setDone(false); setName(""); setEmail(""); setPhone(""); setSubject(""); setMessage(""); setInterests([]); }}
                  className="mt-6 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:opacity-90"
                >
                  Yeni başvuru
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <p className="text-xs text-[#6E6796]">{active.desc}</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LBL}>Ad Soyad *</label>
                    <Input className={INP} value={name} onChange={(e) => setName(e.target.value)} placeholder="Adın" />
                  </div>
                  <div>
                    <label className={LBL}>E-posta *</label>
                    <Input className={INP} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-4"
                  >
                    {tab === "CONTACT" && (
                      <>
                        <div>
                          <label className={LBL}>Konu</label>
                          <Input className={INP} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Konu başlığı" />
                        </div>
                        <div>
                          <label className={LBL}>Mesaj *</label>
                          <textarea className={`${INP} flex min-h-[110px] w-full rounded-md border px-3 py-2 text-sm`} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mesajın…" />
                        </div>
                      </>
                    )}

                    {tab === "EVENT_PROPOSAL" && (
                      <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className={LBL}>Telefon</label>
                            <Input className={INP} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5__ ___ __ __" />
                          </div>
                          <div>
                            <label className={LBL}>Etkinlik adı / türü</label>
                            <Input className={INP} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="ör. Sunset Yoga" />
                          </div>
                        </div>
                        <div>
                          <label className={LBL}>Detaylar (tarih, yer, kapasite, fikir)</label>
                          <textarea className={`${INP} flex min-h-[110px] w-full rounded-md border px-3 py-2 text-sm`} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Etkinlik fikrini anlat…" />
                        </div>
                      </>
                    )}

                    {tab === "MEMBERSHIP" && (
                      <>
                        <div>
                          <label className={LBL}>Telefon</label>
                          <Input className={INP} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5__ ___ __ __" />
                        </div>
                        <div>
                          <label className={LBL}>İlgi alanların</label>
                          <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((c) => {
                              const on = interests.includes(c.slug);
                              return (
                                <button
                                  key={c.slug}
                                  type="button"
                                  onClick={() => toggleInterest(c.slug)}
                                  className="rounded-full border px-3 py-1.5 text-xs transition-colors"
                                  style={{
                                    borderColor: on ? "#8B5CF6" : "#352E6B",
                                    background: on ? "rgba(139,92,246,0.18)" : "transparent",
                                    color: on ? "#E9E5FF" : "#A39DC9",
                                  }}
                                >
                                  {c.emoji} {c.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <label className={LBL}>Kendinden bahset (opsiyonel)</label>
                          <textarea className={`${INP} flex min-h-[90px] w-full rounded-md border px-3 py-2 text-sm`} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Birkaç cümle…" />
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {err && <p className="text-sm text-[#FB7185]">{err}</p>}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-[#6366F1]/20 hover:opacity-90"
                >
                  {loading ? "Gönderiliyor…" : "Gönder"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
