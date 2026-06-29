"use client";

import { useEffect, useRef, useState } from "react";
import { getGoogleConfig, googleLogin } from "@/lib/session";

// Google Identity Services loaded from CDN — no npm dependency.
let gisPromise: Promise<any> | null = null;
function loadGis(): Promise<any> {
  const w = window as any;
  if (w.google?.accounts?.id) return Promise.resolve(w.google);
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve((window as any).google);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return gisPromise;
}

export function GoogleButton({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError?: (msg: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGoogleConfig().then((cfg) => {
      if (cancelled) return;
      if (!cfg.enabled) {
        setEnabled(false);
        return;
      }
      setEnabled(true);
      loadGis()
        .then((google) => {
          if (cancelled || !ref.current) return;
          google.accounts.id.initialize({
            client_id: cfg.clientId,
            callback: async (resp: { credential: string }) => {
              try {
                await googleLogin(resp.credential);
                onSuccess();
              } catch (e: any) {
                onError?.(e.message || "Google ile giriş başarısız");
              }
            },
          });
          google.accounts.id.renderButton(ref.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            locale: "tr",
            width: 320,
          });
        })
        .catch(() => setEnabled(false));
    });
    return () => {
      cancelled = true;
    };
  }, [onSuccess, onError]);

  if (enabled === false) {
    return (
      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-md border border-[#352E6B] bg-[#171336] py-2.5 text-sm text-[#6E6796] opacity-80"
        title="Yönetici Google Client ID ayarlamadan kullanılamaz"
      >
        <GoogleIcon /> Google ile devam et (yakında)
      </button>
    );
  }
  // Google renders its own button into this container.
  return <div ref={ref} className="flex min-h-[44px] justify-center" />;
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
