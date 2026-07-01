import type { MetadataRoute } from "next";

/** PWA manifest — Next otomatik /manifest.webmanifest olarak sunar + <link rel="manifest"> ekler. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Luca — Etkinlik & Topluluk",
    short_name: "Luca",
    description: "Şehrindeki etkinlikleri keşfet, bilet al, canlı izle. Wellness'tan geceye sekiz dünya.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0A0512",
    theme_color: "#0A0512",
    orientation: "portrait-primary",
    lang: "tr",
    dir: "ltr",
    categories: ["events", "social", "lifestyle", "entertainment"],
    icons: [
      { src: "/img/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "maskable" },
    ],
  };
}
