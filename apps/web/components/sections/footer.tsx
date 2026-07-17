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
              <svg viewBox="0 0 100.93 101.9" fill="currentColor" aria-label="Luca" className="size-11 shrink-0 text-foreground">
                <path d="M25.37,67.83c-6.42-6.42-10.39-15.29-10.39-25.09,0-7.46,2.31-14.39,6.24-20.1h-8.49c-3.2,5.99-5.02,12.84-5.02,20.1,0,11.8,4.79,22.49,12.52,30.22,4.99,4.99,11.22,8.76,18.18,10.8l-6.06-10.5c-2.55-1.51-4.89-3.34-6.98-5.43Z"/>
                <path d="M50.46,7.26c9.8,0,18.67,3.97,25.09,10.39,2.83,2.83,5.18,6.13,6.93,9.78l4.24-7.34c-1.72-2.75-3.75-5.29-6.03-7.58C72.95,4.79,62.27,0,50.46,0s-21.8,4.48-29.47,11.78h12.13c5.13-2.88,11.04-4.52,17.34-4.52Z"/>
                <path d="M85.94,43.15c-.11,9.64-4.06,18.35-10.39,24.69-6.42,6.42-15.29,10.39-25.09,10.39-.93,0-1.85-.04-2.76-.11l1.12,1.94,3.12,5.4c11.21-.38,21.33-5.09,28.74-12.49,7.73-7.73,12.52-18.42,12.52-30.22,0-3.48-.42-6.86-1.2-10.09l-6.07,10.5Z"/>
                <path d="M94.65,13.6h-10.48c1.48,1.72,2.85,3.57,4.08,5.55l.57.91-.46.8h0l-3.2,5.54-1.12,1.94-1.71,2.98-12.91,22.36h0s-12.79,22.16-12.79,22.16c2.33-.43,4.58-1.1,6.71-1.98,1.34-.56,2.64-1.2,3.89-1.92l8.45-14.64h0s22.09-38.26,22.09-38.26l3.15-5.45h-6.28Z"/>
                <path d="M11.14,21.82l.51-.95h.92,0s6.4,0,6.4,0h0s2.24,0,2.24,0h3.43s0,0,0,0h51.42c-1.54-1.81-3.25-3.42-5.08-4.83-1.16-.89-2.38-1.7-3.64-2.43H0l3.14,5.45,5.23,9.07c.75-2.14,1.66-4.24,2.76-6.3Z"/>
                <path d="M50.92,87.31l-.45-.79h0s-4.33-7.49-4.33-7.49l-1.72-2.97-12.92-22.37-12.79-22.15c-.8,2.24-1.34,4.52-1.64,6.81-.19,1.44-.29,2.89-.29,4.34l8.45,14.63,22.09,38.27,3.13,5.42,3.14-5.44,5.23-9.05c-2.22.42-4.5.68-6.82.76l-1.08.04Z"/>
              </svg>
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
