"use client";

import { useState } from "react";
import { Nav } from "@/components/nav";
import { Hero } from "@/components/sections/hero";
import { Categories } from "@/components/sections/categories";
import { Activities } from "@/components/sections/activities";
import { Family } from "@/components/sections/family";
import { Subscribe } from "@/components/sections/subscribe";
import { Footer } from "@/components/sections/footer";
import type { CategorySlug } from "@/lib/data";

export default function HomePage() {
  const [filter, setFilter] = useState<CategorySlug | "all">("all");

  return (
    <>
      <Nav />
      <main className="pt-16">
        <Hero />
        <Categories active={filter} onSelect={setFilter} />
        <Activities filter={filter} />
        <Family />
        <Subscribe />
      </main>
      <Footer />
    </>
  );
}
