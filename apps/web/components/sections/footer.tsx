import Image from "next/image";
import Link from "next/link";
import { Instagram, Youtube, Lock } from "lucide-react";
import { COMPANY } from "@/lib/company";

type FLink = { label: string; href: string };

const COLUMNS: { title: string; links: FLink[] }[] = [
  {
    title: "Keşfet",
    links: [
      { label: "Deneyim", href: "/#kategoriler" },
      { label: "Program", href: "/#aktiviteler" },
      { label: "Topluluk", href: "/#aile" },
      { label: "Bize ulaş", href: "/basvuru" },
    ],
  },
  {
    title: "Üyelik",
    links: [
      { label: "Giriş yap", href: "/giris" },
      { label: "Kayıt ol", href: "/kayit" },
      { label: "Hesabım", href: "/hesap" },
      { label: "Şifremi unuttum", href: "/sifremi-unuttum" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { label: "Hakkımızda", href: "/hakkimizda" },
      { label: "Blog", href: "/blog" },
      { label: "İletişim", href: "/iletisim" },
    ],
  },
  {
    title: "Güvenlik & Yasal",
    links: [
      { label: "Güvenlik", href: "/guvenlik" },
      { label: "KVKK", href: "/kvkk" },
      { label: "Çerez Politikası", href: "/cerez" },
      { label: "Kullanım Koşulları", href: "/kosullar" },
      { label: "Mesafeli Satış", href: "/mesafeli-satis" },
    ],
  },
];

const SOCIAL = [
  { label: "Instagram", href: COMPANY.instagramUrl, Icon: Instagram },
  { label: "YouTube", href: COMPANY.youtubeUrl, Icon: Youtube },
  { label: "TikTok", href: "https://www.tiktok.com/@luca.club.tr", Icon: TikTokIcon },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container py-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-12">
          {/* marka */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-4">
            <div className="mb-5 flex items-center gap-3">
              <div className="glow-violet relative size-12 shrink-0 overflow-hidden rounded-md">
                <Image src="/img/logo.png" alt="Luca" fill sizes="48px" className="object-contain" />
              </div>
              <div>
                <div className="font-serif text-xl font-semibold leading-none tracking-[0.18em]">LUCA</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">lucaclub.com.tr · İstanbul</div>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Sadece gece değil, bütün bir şehir. Wellness'tan tekneye, atölyeden sahneye —
              İstanbul'un sekiz dünyasını tek çatı altında keşfet, buluş, yaşa.
            </p>
            <div className="mt-6 flex items-center gap-2.5">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* link kolonları */}
          {COLUMNS.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <div className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {col.title}
              </div>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-foreground/70 transition-colors hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 font-mono text-xs text-muted-foreground md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} Luca · Tüm hakları saklı.</div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href={`mailto:${COMPANY.email}`} className="transition-colors hover:text-foreground">
              {COMPANY.email}
            </a>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-3.5" /> SSL ile güvenli ödeme
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M19.321 5.562a5.124 5.124 0 0 1-5.123-5.124h-3.538v13.914c0 1.726-1.4 3.125-3.125 3.125S4.41 16.078 4.41 14.352s1.4-3.125 3.125-3.125c.33 0 .648.053.948.148V7.819a6.653 6.653 0 0 0-.948-.07c-3.679 0-6.663 2.984-6.663 6.663 0 3.678 2.984 6.663 6.663 6.663s6.663-2.985 6.663-6.663V8.26a8.632 8.632 0 0 0 5.123 1.684V6.406c-.001-.282-.001-.563 0-.844Z" />
    </svg>
  );
}
