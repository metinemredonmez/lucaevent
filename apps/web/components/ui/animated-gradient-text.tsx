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
        "[background-image:linear-gradient(110deg,#22c9b8_0%,#22c9b8_35%,#7fe6da_50%,#22c9b8_65%,#22c9b8_100%)]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
