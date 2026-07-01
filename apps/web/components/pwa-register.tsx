"use client";

import { useEffect } from "react";

/** Service worker'ı kaydeder — PWA yüklenebilirliği + çevrimdışı kabuk. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const id = setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }, 1200); // ilk boyamayı bloklamamak için biraz geç
    return () => clearTimeout(id);
  }, []);
  return null;
}
