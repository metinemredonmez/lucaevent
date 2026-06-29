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

// 0..4 — length + lower + upper + digit + symbol
export function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
