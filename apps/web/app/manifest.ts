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
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
