import type { Metadata, Viewport } from "next";
import { Newsreader, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { BackgroundMusic } from "@/components/background-music";
import { PushInit } from "@/components/push-init";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const geistSans = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://luca.club"),
  title: {
    default: "LUCA — Gece kendi ritmini bulur",
    template: "%s · LUCA",
  },
  description:
    "Luca — bir sahne, bir sofra, bir gece. Premium club deneyimi, özenle seçilmiş müzik, sıradışı atmosfer.",
  keywords: [
    "luca club",
    "istanbul club",
    "gece kulübü",
    "premium club",
    "luca",
    "rezervasyon",
  ],
  authors: [{ name: "Luca Club" }],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://luca.club",
    title: "LUCA",
    description: "Gece kendi ritmini bulur.",
    siteName: "Luca",
    images: [{ url: "/img/og.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LUCA",
    description: "Gece kendi ritmini bulur.",
    images: ["/img/og.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8FF" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0512" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      className={`${newsreader.variable} ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <PushInit />
          <BackgroundMusic />
          <Toaster
            position="bottom-center"
            toastOptions={{
              className:
                "!bg-card !text-card-foreground !border-border",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
