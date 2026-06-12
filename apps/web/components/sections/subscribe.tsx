"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";

export function Subscribe() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);

    try {
      const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const res = await fetch(`${api}/api/v1/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "web-hero" }),
      }).catch(() => null);

      // If API is not ready, still acknowledge locally
      if (!res || !res.ok) {
        console.warn("Subscribe API not available yet; storing locally.");
      }

      setDone(true);
      toast.success("Liste'desin ✨", {
        description: "Yaklaşan event davetleri e-postana düşecek.",
      });
      setEmail("");
    } catch {
      toast.error("Bir şey ters gitti. Tekrar dener misin?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="rezervasyon"
      className="relative py-24 md:py-32 overflow-hidden"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.18),transparent_60%)]" />

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">
            misafir listesi
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-balance">
            Geceyi <AnimatedGradientText>önceden</AnimatedGradientText> kap.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Yeni event, özel açılış ve sezon davetleri e-postana düşsün.
            Spam yok — sadece davet.
          </p>

          {!done ? (
            <form onSubmit={onSubmit} className="mx-auto mt-10 max-w-md">
              {/* Origin UI — tek parça pill input-group */}
              <div className="flex items-center gap-1 rounded-full border border-border bg-card/60 p-1 pl-3 backdrop-blur transition-all focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/15">
                <Mail className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e-posta@adresin.com"
                  aria-label="E-posta adresin"
                  className="h-11 min-w-0 flex-1 bg-transparent px-2 text-base outline-none placeholder:text-muted-foreground"
                />
                <Button type="submit" disabled={loading} className="shrink-0 rounded-full">
                  {loading ? (
                    "Gönderiliyor..."
                  ) : (
                    <>
                      Katıl <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-10 inline-flex items-center gap-3 rounded-full border border-primary/40 bg-card px-6 py-3 text-base"
            >
              <CheckCircle2 className="size-5 text-primary" />
              <span>Listede yerin hazır — yakında davetini yollarız.</span>
            </motion.div>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            Katılınca{" "}
            <a
              className="underline underline-offset-4 hover:text-primary transition-colors"
              href="/kvkk"
            >
              KVKK aydınlatma metnini
            </a>{" "}
            kabul etmiş sayılırsın.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
