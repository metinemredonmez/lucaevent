"use client";

import { useState } from "react";
import { Nav } from "@/components/nav";
import { CityPulse } from "@/components/sections/city-pulse";
import { Collections } from "@/components/sections/collections";
import { Categories } from "@/components/sections/categories";
import { Showcase } from "@/components/sections/showcase";
import { Family } from "@/components/sections/family";
import { MobileApp } from "@/components/sections/mobile-app";
import { Subscribe } from "@/components/sections/subscribe";
import { Footer } from "@/components/sections/footer";
import type { CategorySlug } from "@/lib/data";

export default function HomePage() {
  const [filter, setFilter] = useState<CategorySlug | "all">("all");

  return (
    <>
      <Nav />
      <main className="pt-16">
        {/* "Şehrin Nabzı" — zaman eksenli canlı etkinlik panosu (yeni kimlik, hero + event listeleri yerine) */}
        <CityPulse />
        {/* Admin'den yönetilen video koleksiyonları — panonun hemen altında */}
        <Collections />
        <Categories active={filter} onSelect={setFilter} />
        <Showcase />
        <Family />
        <MobileApp />
        <Subscribe />
      </main>
      <Footer />
    </>
  );
}
