"use client";

import { useEffect } from "react";
import { getPushConfig, getUserId } from "@/lib/session";

/**
 * OneSignal web-push başlatıcı. App ID admin → Ayarlar → Kimlik/Push'tan gelir.
 * Yapılandırılmamışsa hiçbir şey yapmaz (graceful). Service worker: /OneSignalSDKWorker.js
 */
let started = false;

export function PushInit() {
  useEffect(() => {
    if (started) return;
    started = true;

    getPushConfig().then((cfg) => {
      if (!cfg.enabled || !cfg.appId) return; // App ID girilene kadar sessiz

      const w = window as any;
      w.OneSignalDeferred = w.OneSignalDeferred || [];
      w.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          await OneSignal.init({
            appId: cfg.appId,
            allowLocalhostAsSecureOrigin: true,
          });
          // Giriş yapmış kullanıcıyı OneSignal external id'sine bağla (hedefli push için)
          const uid = getUserId();
          if (uid) {
            try {
              await OneSignal.login(uid);
            } catch {
              /* sessiz */
            }
          }
        } catch {
          /* init hatası — sessiz geç */
        }
      });

      const s = document.createElement("script");
      s.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      s.defer = true;
      document.head.appendChild(s);
    });
  }, []);

  return null;
}
