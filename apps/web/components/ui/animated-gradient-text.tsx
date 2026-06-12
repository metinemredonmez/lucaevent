import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Magic UI — Animated Gradient Text.
 * Akan (canlı) bir mor gradyanı metne uygular. `.text-gold-grad` statik
 * versiyonun yerini alır; aynı neon menekşe paletini kullanır.
 */
export function AnimatedGradientText({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-block animate-gradient-x bg-[length:200%_auto] bg-clip-text text-transparent",
        "[background-image:linear-gradient(110deg,#8B5CF6_0%,#A855F7_35%,#C4B5FD_50%,#A855F7_65%,#8B5CF6_100%)]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
