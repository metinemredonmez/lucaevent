// Public (member) session — separate token from the admin panel.
const BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";
const KEY = "luca_session";

export function getSession(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
}
export function setSession(t: string) {
  localStorage.setItem(KEY, t);
}
export function clearSession() {
  localStorage.removeItem(KEY);
}

async function post(path: string, body: unknown) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || "İşlem başarısız";
    throw new Error(msg);
  }
  return data;
}

/** Authed request with the member Bearer token. 401 clears the session. */
async function authReq(
  path: string,
  opts: { method?: string; body?: unknown } = {},
) {
  const token = getSession();
  const res = await fetch(BASE + path, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401) {
    clearSession();
    throw new Error("Oturum süresi doldu. Lütfen tekrar giriş yapın.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || "İşlem başarısız";
    throw new Error(msg);
  }
  return data;
}

export type RegisterBody = {
  name?: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  birthDate?: string; // ISO (YYYY-MM-DD)
  interests?: string[];
  kvkkConsent: boolean;
  termsAccepted: boolean;
  marketingOptIn?: boolean;
};

export async function registerUser(body: RegisterBody) {
  const data = await post("/auth/register", body);
  if (data.accessToken) setSession(data.accessToken);
  return data;
}

export async function loginUser(email: string, password: string) {
  const data = await post("/auth/login", { email, password });
  if (data.accessToken) setSession(data.accessToken);
  return data;
}

export async function forgotPassword(email: string) {
  return post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, password: string) {
  return post("/auth/reset-password", { token, password });
}

export async function verifyEmail(token: string) {
  return post("/auth/verify-email", { token });
}

export async function resendVerification(email: string) {
  return post("/auth/resend-verification", { email });
}

export type SubmissionBody = {
  type: "CONTACT" | "EVENT_PROPOSAL" | "MEMBERSHIP";
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  payload?: Record<string, unknown>;
};

export async function createSubmission(body: SubmissionBody) {
  return post("/submissions", body);
}

// ——— Telefon doğrulama (SMS OTP) ———
export function sendPhoneOtp(phone: string): Promise<{ ok: boolean; expiresInSec: number }> {
  return post("/sms/otp/send", { phone });
}
export function verifyPhoneOtp(phone: string, code: string): Promise<{ ok: boolean }> {
  return post("/sms/otp/verify", { phone, code });
}

// ——— Uygulama-içi bildirim merkezi (çan) ———
export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: string;
};
export function getNotifications(): Promise<AppNotification[]> {
  return authReq("/me/notifications");
}
export function getUnreadCount(): Promise<{ count: number }> {
  return authReq("/me/notifications/unread-count");
}
export function markNotificationsRead(ids?: string[]): Promise<{ ok: boolean }> {
  return authReq("/me/notifications/read", {
    method: "POST",
    body: ids?.length ? { ids } : {},
  });
}

export async function getGoogleConfig(): Promise<{ enabled: boolean; clientId: string }> {
  try {
    const r = await fetch(BASE + "/auth/google/config");
    return await r.json();
  } catch {
    return { enabled: false, clientId: "" };
  }
}

export async function googleLogin(idToken: string) {
  const data = await post("/auth/google", { idToken });
  if (data.accessToken) setSession(data.accessToken);
  return data;
}

export async function getPushConfig(): Promise<{ enabled: boolean; appId: string }> {
  try {
    const r = await fetch(BASE + "/push/config");
    return await r.json();
  } catch {
    return { enabled: false, appId: "" };
  }
}

/** JWT payload'undan user id (sub) — OneSignal.login(external_id) için. */
export function getUserId(): string | null {
  const t = getSession();
  if (!t) return null;
  try {
    const payload = JSON.parse(atob(t.split(".")[1] ?? ""));
    return payload.sub ?? payload.userId ?? null;
  } catch {
    return null;
  }
}

// ——— Hesabım (üye profil / biletler / favoriler) ———

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  phone: string | null;
  city: string | null;
  birthDate: string | null;
  interests: string[];
  emailVerified: boolean;
  marketingOptIn: boolean;
  createdAt: string;
  hasPassword: boolean;
  hasGoogle: boolean;
};

export type ProfileUpdate = {
  name?: string;
  phone?: string;
  city?: string;
  birthDate?: string;
  interests?: string[];
  marketingOptIn?: boolean;
};

export function getProfile(): Promise<Profile> {
  return authReq("/auth/profile");
}
export function updateProfile(body: ProfileUpdate): Promise<Profile> {
  return authReq("/auth/profile", { method: "PATCH", body });
}
export function changePassword(body: {
  currentPassword?: string;
  newPassword: string;
}): Promise<{ ok: boolean }> {
  return authReq("/auth/change-password", { method: "POST", body });
}
export function deleteAccount(): Promise<{ ok: boolean }> {
  return authReq("/auth/account", { method: "DELETE" });
}

export type MyOrder = {
  id: string;
  code: string;
  status: string;
  totalMinor: number;
  currency: string;
  createdAt: string;
  items: Array<{ id: string; quantity?: number; qty?: number }>;
  event?: {
    title: string;
    slug: string;
    startsAt: string;
    coverUrl: string | null;
  } | null;
};
export function getMyBookings(): Promise<MyOrder[]> {
  return authReq("/me/bookings");
}

export type FavoriteItem = {
  id: string;
  event: {
    id: string;
    slug: string;
    title: string;
    startsAt: string;
    coverUrl: string | null;
    kind: string;
    category?: { slug: string; name: string } | null;
  };
};
export function getMyFavorites(): Promise<FavoriteItem[]> {
  return authReq("/me/favorites");
}
export function removeFavorite(eventId: string): Promise<unknown> {
  return authReq(`/me/favorites/${eventId}`, { method: "DELETE" });
}

// 0..4 — length + lower + upper + digit + symbol
export function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
