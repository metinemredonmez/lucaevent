"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = mounted ? (theme === "system" ? resolvedTheme : theme) : "dark";
  const isDark = current === "dark";
  const next = isDark ? "light" : "dark";

  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={`${isDark ? "Aydınlık" : "Koyu"} temaya geç`}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-md",
        "text-muted-foreground hover:text-foreground transition-colors",
        "hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-hidden"
      )}
    >
      {/* subtle orbit ring that rotates on theme change */}
      <motion.span
        key={`ring-${isDark ? "dark" : "light"}`}
        className="absolute inset-[6px] rounded-full border border-primary/20"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, rotate: [0, 8, -8, 0] }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ y: -16, opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
            exit={{ y: 16, opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="absolute inline-flex"
          >
            <Moon className="size-[18px]" strokeWidth={1.8} />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ y: -16, opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
            exit={{ y: 16, opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="absolute inline-flex"
          >
            <Sun className="size-[18px]" strokeWidth={1.8} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
