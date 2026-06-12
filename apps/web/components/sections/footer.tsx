import Image from "next/image";
import { Instagram, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container py-14">
        <div className="grid md:grid-cols-[1.2fr_1fr_1fr] gap-10">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="relative size-12 shrink-0 rounded-md overflow-hidden glow-violet">
                <Image
                  src="/img/logo.png"
                  alt="Luca Club"
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </div>
              <div>
                <div className="font-serif text-xl leading-none font-semibold tracking-[0.18em]">
                  LUCA
                </div>
                <div className="text-xs font-mono text-muted-foreground mt-1">
                  @luca.club.tr · İstanbul
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Gece kendi ritmini bulur. Bir sahne, bir sofra, bir gece —
              Luca'da özenle seçilmiş müzik ve atmosfer bir araya gelir.
            </p>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Keşfet
            </div>
            <ul className="space-y-2 text-sm">
              <li><a href="#deneyim" className="hover:text-primary">Deneyim</a></li>
              <li><a href="#program" className="hover:text-primary">Bu haftanın programı</a></li>
              <li><a href="#mekan" className="hover:text-primary">Mekân</a></li>
              <li><a href="#rezervasyon" className="hover:text-primary">Rezervasyon</a></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Sosyal
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.instagram.com/luca.club.tr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-primary"
                >
                  <Instagram className="size-4" /> Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-primary"
                >
                  <Youtube className="size-4" /> YouTube
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-primary"
                >
                  <TikTokIcon /> TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-muted-foreground font-mono">
          <div>
            © {new Date().getFullYear()} LUCA Club. Tüm hakları saklı.
          </div>
          <div className="flex gap-4">
            <a href="/kvkk" className="hover:text-foreground transition-colors">KVKK</a>
            <a href="/cerez" className="hover:text-foreground transition-colors">Çerez Politikası</a>
            <a href="/iletisim" className="hover:text-foreground transition-colors">İletişim</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function TikTokIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.321 5.562a5.124 5.124 0 0 1-5.123-5.124h-3.538v13.914c0 1.726-1.4 3.125-3.125 3.125S4.41 16.078 4.41 14.352s1.4-3.125 3.125-3.125c.33 0 .648.053.948.148V7.819a6.653 6.653 0 0 0-.948-.07c-3.679 0-6.663 2.984-6.663 6.663 0 3.678 2.984 6.663 6.663 6.663s6.663-2.985 6.663-6.663V8.26a8.632 8.632 0 0 0 5.123 1.684V6.406c-.001-.282-.001-.563 0-.844Z" />
    </svg>
  );
}
