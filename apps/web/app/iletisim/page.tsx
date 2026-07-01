import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Instagram, Youtube, Mail, MapPin, Clock } from "lucide-react";
import { COMPANY } from "@/lib/company";
import { getPage } from "@/lib/content";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Luca ile iletişime geç — etkinlik önerileri, iş birlikleri, medya ve destek.",
};

const CHANNELS = [
  {
    icon: Mail,
    label: "E-posta",
    value: COMPANY.email,
    href: `mailto:${COMPANY.email}`,
    hint: "Genel sorular ve destek",
  },
  {
    icon: Instagram,
    label: "Instagram",
    value: COMPANY.instagram,
    href: COMPANY.instagramUrl,
    hint: "Günlük akış, duyurular, DM ile sohbet",
  },
  {
    icon: Youtube,
    label: "YouTube",
    value: "Luca",
    href: COMPANY.youtubeUrl,
    hint: "Etkinlik özetleri, müzik",
  },
];

const FAQS = [
  {
    q: "Luca'ya nasıl katılırım?",
    a: "Ana sayfadan ücretsiz hesap oluştur; ilgi alanlarını seç, sana göre etkinlik önerileri ve hatırlatmalar al.",
  },
  {
    q: "Üyelik ücretli mi?",
    a: "Hesap açmak ücretsiz. Bazı etkinliklerde bilet/katılım ücreti olabilir — her etkinlikte ücret açıkça belirtilir.",
  },
  {
    q: "Bir etkinlik önerim var, nereye yazayım?",
    a: `${COMPANY.email} adresine konu başlığına "Etkinlik önerisi" yazarak gönderebilir ya da Instagram DM'den ulaşabilirsin.`,
  },
  {
    q: "İş birliği / sponsorluk için nasıl iletişime geçerim?",
    a: `${COMPANY.email} adresine "İş birliği" konusuyla yazabilirsin. Marka kiti ve geçmiş etkinlik istatistiklerini paylaşıyoruz.`,
  },
  {
    q: "Fotoğrafımın paylaşılmasını istemiyorum, ne yapabilirim?",
    a: `${COMPANY.kvkkEmail} adresine bildirirsen ilgili kare en kısa sürede kaldırılır. Daha fazlası için KVKK sayfasına bakabilirsin.`,
  },
];

const FALLBACK_TITLE = "Merhaba de — aramızdan birine denk gelirsin.";
const FALLBACK_INTRO =
  "Sorun, fikrin, iş birliği teklifin mi var? En hızlı yanıtı Instagram DM üzerinden alırsın. Daha detaylı konular için e-posta ya da formu kullan.";

export default async function IletisimPage() {
  // Başlık + giriş metni admin panelinden ("iletisim" sayfası) düzenlenebilir; yoksa varsayılan.
  const page = await getPage("iletisim");
  const heroTitle = page?.title?.trim() || FALLBACK_TITLE;
  const heroIntro = page?.excerpt?.trim() || FALLBACK_INTRO;

  return (
    <main className="pt-28 md:pt-36 pb-28">
      <div className="container max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Ana sayfa
        </Link>

        <div className="mt-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 backdrop-blur-sm px-3 py-1">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full rounded-full bg-primary opacity-60 animate-ping" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
              Bize yaz
            </span>
          </div>
        </div>

        <h1 className="mt-5 font-serif text-3xl md:text-4xl leading-[1.05] tracking-tight text-balance font-semibold max-w-3xl">
          {heroTitle}
        </h1>

        <p className="mt-5 text-lg text-muted-foreground max-w-2xl">{heroIntro}</p>

        <div className="mt-16 grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16">
          {/* Contact form — gerçek /submissions POST */}
          <ContactForm />

          {/* Channels + meta */}
          <div className="space-y-10">
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground mb-5">
                02 / Kanallar
              </div>
              <ul className="space-y-3">
                {CHANNELS.map(({ icon: Icon, label, value, href, hint }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="group flex items-start gap-4 rounded-xl border border-border bg-card/50 p-4 hover:border-primary/60 hover:bg-card transition-all"
                    >
                      <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                          {label}
                        </div>
                        <div className="mt-0.5 font-medium truncate">{value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {hint}
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground mb-5">
                03 / Nerede & ne zaman
              </div>
              <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">İstanbul</div>
                    <div className="text-sm text-muted-foreground">
                      Etkinlikler şehir içi — Kadıköy, Beyoğlu, Beşiktaş ağırlıklı
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="size-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Yanıt süresi</div>
                    <div className="text-sm text-muted-foreground">
                      E-posta 24–48 saat · Instagram DM 12 saat
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <div className="text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground mb-3">
            Sıkça sorulanlar
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight mb-10">
            Önce buraya bak — belki cevabı hazır.
          </h2>
          <div className="divide-y divide-border border-y border-border">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                  <span className="font-medium text-base md:text-lg">{q}</span>
                  <span className="text-muted-foreground group-open:rotate-45 transition-transform text-2xl leading-none">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-muted-foreground max-w-3xl">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
