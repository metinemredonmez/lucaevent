// Luca Admin — API client (JWT in localStorage, sessiz refresh, 401'de login'e)
const BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";
const TOKEN_KEY = "luca_admin_token";
const REFRESH_KEY = "luca_admin_refresh";

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function getRefresh(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null;
}
export function setRefresh(t: string) {
  localStorage.setItem(REFRESH_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// Eşzamanlı 401'lerde tek refresh çağrısı yap (paylaşılan in-flight promise).
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  const rt = getRefresh();
  if (!rt) return null;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(BASE + "/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data?.accessToken) {
          setToken(data.accessToken);
          if (data.refreshToken) setRefresh(data.refreshToken); // rotation
          return data.accessToken as string;
        }
        return null;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

function redirectToLogin() {
  clearToken();
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.endsWith("/admin/login")
  ) {
    window.location.href = "/admin/login";
  }
}

export async function api<T = any>(
  path: string,
  opts: RequestInit = {},
  _retried = false,
): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401) {
    // Access token süresi dolmuş olabilir — refresh token ile bir kez yenile, isteği tekrarla.
    if (!_retried) {
      const fresh = await refreshAccess();
      if (fresh) return api<T>(path, opts, true);
    }
    redirectToLogin();
    throw new Error("Oturum sona erdi");
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

export async function login(email: string, password: string) {
  const res = await fetch(BASE + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Giriş başarısız");
  setToken(data.accessToken);
  if (data.refreshToken) setRefresh(data.refreshToken); // 30 günlük oturum için sakla
  return data;
}

export function logout() {
  // refresh token'ı sunucuda iptal et (best-effort, keepalive ile navigasyona dayanır)
  const rt = getRefresh();
  if (rt) {
    fetch(BASE + "/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
      keepalive: true,
    }).catch(() => {});
  }
  clearToken();
  if (typeof window !== "undefined") window.location.href = "/admin/login";
}

/** Authenticated file download (CSV vb.) — token'ı header'la gönderip blob indirir; 401'de refresh dener. */
export async function apiDownload(path: string, filename: string, _retried = false) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401 && !_retried) {
    const fresh = await refreshAccess();
    if (fresh) return apiDownload(path, filename, true);
    redirectToLogin();
    throw new Error("Oturum sona erdi");
  }
  if (!res.ok) throw new Error("İndirme başarısız");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
