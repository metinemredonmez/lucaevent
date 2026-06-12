"use client";

import { cn } from "@/lib/utils";
import type { Category } from "@/lib/data";

interface Props {
  category: Category;
  title?: string;
  /** If true, renders with a larger center glyph (for activity cards). */
  showEmoji?: boolean;
  className?: string;
}

/**
 * Clean poster fallback shown when an event/category has no photo yet.
 * Just a rich gradient using the category's accent color — no icons.
 */
export function PosterFallback({ category, showEmoji = false, className }: Props) {
  const accent = category.accent;

  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden",
        className
      )}
      aria-hidden
    >
      {/* layered radial gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 120% 80% at 20% 10%, ${accent}66 0%, transparent 60%),
                       radial-gradient(ellipse 100% 70% at 80% 100%, ${accent}33 0%, transparent 65%),
                       linear-gradient(160deg, ${accent}22 0%, #141418 55%, #0B0B0E 100%)`,
        }}
      />
      {/* very subtle diagonal texture */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #FAFAFA 0, #FAFAFA 1px, transparent 1px, transparent 14px)`,
        }}
      />
      {/* noise */}
      <div className="absolute inset-0 bg-noise opacity-[0.12]" />

      {showEmoji && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-5xl opacity-20 select-none">{category.emoji}</div>
        </div>
      )}
    </div>
  );
}
