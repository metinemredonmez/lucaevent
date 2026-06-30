"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Ticket,
  Heart,
  ShieldCheck,
  LogOut,
  Loader2,
  Check,
  CalendarDays,
  Trash2,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";
import {
  getSession,
  clearSession,
  logoutUser,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getMyBookings,
  getMyFavorites,
  removeFavorite,
  passwordScore,
  type Profile,
  type MyOrder,
  type FavoriteItem,
} from "@/lib/session";
import { CATEGORIES } from "@/lib/data";
import { formatDateTR } from "@/lib/utils";

const TABS = [
  { id: "profil", label: "Profil", icon: User },
  { id: "biletler", label: "Biletlerim", icon: Ticket },
  { id: "favoriler", label: "Favoriler", icon: Heart },
  { id: "guvenlik", label: "Güvenlik", icon: ShieldCheck },
] as const;
type TabId = (typeof TABS)[number]["id"];

const INP =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15";
const LBL = "mb-1.5 block text-xs font-medium text-muted-foreground";

const tl = (minor: number, cur = "TRY") =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(
    (minor || 0) / 100,
  );

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  PAID: { label: "Ödendi", cls: "bg-emerald-500/15 text-emerald-500" },
  PENDING: { label: "Bekliyor", cls: "bg-amber-500/15 text-amber-500" },
  CANCELED: { label: "İptal", cls: "bg-rose-500/15 text-rose-500" },
  REFUNDED: { label: "İade", cls: "bg-sky-500/15 text-sky-500" },
  EXPIRED: { label: "Süresi doldu", cls: "bg-muted text-muted-foreground" },
};

export default function HesapPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabId>("profil");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!getSession()) {
      router.replace("/giris?next=/hesap");
      return;
    }
    getProfile()
      .then((p) => {
        setProfile(p);
        setReady(true);
      })
      .catch((e) => {
        setErr(e.message);
        setReady(true);
        if (String(e.message).includes("Oturum")) router.replace("/giris?next=/hesap");
      });
  }, [router]);

  function logout() {
    logoutUser();
    router.push("/");
  }

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  const initials =
    (profile?.name?.trim()?.[0] || profile?.email?.[0] || "L").toUpperCase();

  return (
    <main className="min-h-screen bg-background pb-24 pt-24">
      <div className="container max-w-4xl">
        {/* başlık */}
        <div className="mb-8 flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-xl font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-2xl sm:text-3xl">
              Merhaba{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          <button
            onClick={logout}
            className="ml-auto hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:border-rose-500/40 hover:text-rose-500 sm:flex"
          >
            <LogOut className="h-4 w-4" /> Çıkış
          </button>
        </div>

        {err && !profile && (
          <p className="rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-500">{err}</p>
        )}

        {/* sekme barı */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card/50 p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  on ? "text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="hesap-tab"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "profil" && profile && (
              <ProfilTab profile={profile} onSaved={setProfile} />
            )}
            {tab === "biletler" && <BiletlerTab />}
            {tab === "favoriler" && <FavorilerTab />}
            {tab === "guvenlik" && profile && (
              <GuvenlikTab profile={profile} onLogout={logout} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ——————————————————————— Profil ——————————————————————— */
function ProfilTab({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const [f, setF] = useState({
    name: profile.name ?? "",
    phone: profile.phone ?? "",
    city: profile.city ?? "",
    birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : "",
    marketingOptIn: profile.marketingOptIn,
  });
  const [interests, setInterests] = useState<string[]>(profile.interests ?? []);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  function toggle(slug: string) {
    setInterests((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOk(false);
    setSaving(true);
    try {
      const p = await updateProfile({
        name: f.name,
        phone: f.phone,
        city: f.city,
        birthDate: f.birthDate || undefined,
        interests,
        marketingOptIn: f.marketingOptIn,
      });
      onSaved(p);
      setOk(true);
      setTimeout(() => setOk(false), 2500);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
          {profile.emailVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-500">
              <BadgeCheck className="h-3.5 w-3.5" /> E-posta doğrulandı
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-500">
              <AlertTriangle className="h-3.5 w-3.5" /> E-posta doğrulanmadı
            </span>
          )}
          {profile.hasGoogle && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">Google bağlı</span>
          )}
          <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
            Üyelik: {formatDateTR(profile.createdAt)}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LBL}>Ad Soyad</label>
            <input className={INP} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Adın Soyadın" />
          </div>
          <div className="sm:col-span-2">
            <label className={LBL}>E-posta</label>
            <input className={INP + " opacity-60"} value={profile.email} disabled />
          </div>
          <div>
            <label className={LBL}>Telefon</label>
            <input className={INP} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="05xx xxx xx xx" />
          </div>
          <div>
            <label className={LBL}>Şehir</label>
            <input className={INP} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="İstanbul" />
          </div>
          <div>
            <label className={LBL}>Doğum tarihi</label>
            <input type="date" className={INP} value={f.birthDate} onChange={(e) => setF({ ...f, birthDate: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <label className={LBL}>İlgi alanların</label>
        <p className="mb-3 text-xs text-muted-foreground/70">Sana uygun etkinlikleri önermek için kullanırız.</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const on = interests.includes(c.slug);
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => toggle(c.slug)}
                className={`rounded-full border px-3 py-1.5 text-xs transition active:scale-95 ${
                  on
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {c.emoji} {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-[#8B5CF6]"
          checked={f.marketingOptIn}
          onChange={(e) => setF({ ...f, marketingOptIn: e.target.checked })}
        />
        <span className="text-muted-foreground">
          Yeni etkinlikler ve kampanyalardan <span className="text-foreground">e-posta ile haberdar olmak</span> istiyorum.
        </span>
      </label>

      {err && <p className="text-sm text-rose-500">{err}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : ok ? <Check className="h-4 w-4" /> : null}
          {saving ? "Kaydediliyor…" : ok ? "Kaydedildi" : "Değişiklikleri kaydet"}
        </button>
      </div>
    </form>
  );
}

/* ——————————————————————— Biletler ——————————————————————— */
function BiletlerTab() {
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    getMyBookings().then(setOrders).catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="text-sm text-rose-500">{err}</p>;
  if (!orders) return <Skeleton />;
  if (orders.length === 0)
    return (
      <Empty
        icon={Ticket}
        title="Henüz biletin yok"
        desc="Bir etkinliğe katıldığında biletlerin burada görünür."
        cta={{ href: "/", label: "Etkinliklere göz at" }}
      />
    );

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const st = ORDER_STATUS[o.status] ?? { label: o.status, cls: "bg-muted text-muted-foreground" };
        const qty = o.items?.reduce((n, it) => n + (it.quantity ?? it.qty ?? 1), 0) || o.items?.length || 0;
        return (
          <div key={o.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-muted bg-cover bg-center"
              style={o.event?.coverUrl ? { backgroundImage: `url(${o.event.coverUrl})` } : undefined}
            >
              {!o.event?.coverUrl && <Ticket className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {o.event?.title ?? "Etkinlik bileti"}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {o.event?.startsAt ? formatDateTR(o.event.startsAt) : formatDateTR(o.createdAt)}
                {qty > 0 && ` · ${qty} adet`} · #{o.code}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">{tl(o.totalMinor, o.currency)}</div>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] ${st.cls}`}>{st.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ——————————————————————— Favoriler ——————————————————————— */
function FavorilerTab() {
  const [favs, setFavs] = useState<FavoriteItem[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    getMyFavorites().then(setFavs).catch((e) => setErr(e.message));
  }, []);

  async function remove(eventId: string) {
    setFavs((s) => s?.filter((f) => f.event.id !== eventId) ?? null);
    try {
      await removeFavorite(eventId);
    } catch {
      /* optimistic; sessizce geç */
    }
  }

  if (err) return <p className="text-sm text-rose-500">{err}</p>;
  if (!favs) return <Skeleton />;
  if (favs.length === 0)
    return (
      <Empty
        icon={Heart}
        title="Favori listen boş"
        desc="Beğendiğin etkinlikleri favorilere ekle, kaçırma."
        cta={{ href: "/", label: "Etkinlikleri keşfet" }}
      />
    );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {favs.map((f) => (
        <div key={f.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card">
          <div
            className="h-28 bg-muted bg-cover bg-center"
            style={f.event.coverUrl ? { backgroundImage: `url(${f.event.coverUrl})` } : undefined}
          />
          <button
            onClick={() => remove(f.event.id)}
            aria-label="Favoriden çıkar"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-rose-500"
          >
            <Heart className="h-4 w-4 fill-current" />
          </button>
          <div className="p-4">
            {f.event.category && (
              <span className="text-[11px] uppercase tracking-wide text-primary">{f.event.category.name}</span>
            )}
            <div className="truncate text-sm font-medium text-foreground">{f.event.title}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> {formatDateTR(f.event.startsAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ——————————————————————— Güvenlik ——————————————————————— */
function GuvenlikTab({ profile, onLogout }: { profile: Profile; onLogout: () => void }) {
  const router = useRouter();
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [cf, setCf] = useState("");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  const [confirmDel, setConfirmDel] = useState(false);
  const [delLoading, setDelLoading] = useState(false);

  const score = passwordScore(nw);
  const scoreLabel = ["çok zayıf", "zayıf", "orta", "iyi", "güçlü"][score];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOk(false);
    if (nw.length < 8) return setErr("Yeni şifre en az 8 karakter olmalı.");
    if (nw !== cf) return setErr("Şifreler eşleşmiyor.");
    setSaving(true);
    try {
      await changePassword({
        currentPassword: profile.hasPassword ? cur : undefined,
        newPassword: nw,
      });
      setOk(true);
      setCur("");
      setNw("");
      setCf("");
      setTimeout(() => setOk(false), 2500);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    setDelLoading(true);
    try {
      await deleteAccount();
      clearSession();
      router.push("/");
    } catch (e: any) {
      setErr(e.message);
      setDelLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">
          {profile.hasPassword ? "Şifre değiştir" : "Şifre belirle"}
        </h2>
        <p className="mb-4 text-xs text-muted-foreground/70">
          {profile.hasPassword
            ? "Güvenliğin için güçlü ve sana özel bir şifre seç."
            : "Google ile giriş yapıyorsun. İstersen e-posta+şifre ile de girebilmek için bir şifre belirle."}
        </p>
        <div className="grid max-w-md gap-4">
          {profile.hasPassword && (
            <div>
              <label className={LBL}>Mevcut şifre</label>
              <input type="password" className={INP} value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
            </div>
          )}
          <div>
            <label className={LBL}>Yeni şifre</label>
            <input type="password" className={INP} value={nw} onChange={(e) => setNw(e.target.value)} autoComplete="new-password" />
            {nw && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-1.5 flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-full flex-1 rounded-full transition-colors ${
                        i < score ? (score <= 1 ? "bg-rose-500" : score <= 2 ? "bg-amber-500" : "bg-emerald-500") : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground">{scoreLabel}</span>
              </div>
            )}
          </div>
          <div>
            <label className={LBL}>Yeni şifre (tekrar)</label>
            <input type="password" className={INP} value={cf} onChange={(e) => setCf(e.target.value)} autoComplete="new-password" />
          </div>
        </div>

        {err && <p className="mt-4 text-sm text-rose-500">{err}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : ok ? <Check className="h-4 w-4" /> : null}
          {saving ? "Kaydediliyor…" : ok ? "Güncellendi" : profile.hasPassword ? "Şifreyi güncelle" : "Şifreyi belirle"}
        </button>
      </form>

      {/* mobil çıkış */}
      <button
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground transition hover:text-foreground sm:hidden"
      >
        <LogOut className="h-4 w-4" /> Çıkış yap
      </button>

      {/* tehlikeli bölge */}
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-rose-500">
          <AlertTriangle className="h-4 w-4" /> Hesabı sil
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Hesabın kalıcı olarak kapatılır, kişisel bilgilerin silinir (KVKK). Bu işlem geri alınamaz.
        </p>
        {!confirmDel ? (
          <button
            onClick={() => setConfirmDel(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-500/40 px-4 py-2 text-sm text-rose-500 transition hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4" /> Hesabımı sil
          </button>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-foreground">Emin misin?</span>
            <button
              onClick={doDelete}
              disabled={delLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600 disabled:opacity-60"
            >
              {delLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Evet, sil
            </button>
            <button onClick={() => setConfirmDel(false)} className="text-sm text-muted-foreground hover:text-foreground">
              Vazgeç
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ——————————————————————— ortak ——————————————————————— */
function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-card/50" />
      ))}
    </div>
  );
}

function Empty({
  icon: Icon,
  title,
  desc,
  cta,
}: {
  icon: typeof Ticket;
  title: string;
  desc: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{desc}</p>
      <Link
        href={cta.href}
        className="mt-5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        {cta.label}
      </Link>
    </div>
  );
}
