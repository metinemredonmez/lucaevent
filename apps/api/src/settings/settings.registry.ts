/**
 * Known runtime settings. The registry is the source of truth for:
 * - which settings exist (admin form),
 * - their env-var fallback (used until set in DB),
 * - category + secret flag (masking / encryption).
 * Bootstrap secrets (DATABASE_URL, REDIS_URL, JWT secrets) are intentionally
 * NOT here — they must stay in env (needed before DB access). See ADR-013.
 */
export interface SettingDef {
  key: string;
  env: string;
  category: 'auth' | 'payment' | 'push' | 'mail' | 'sms' | 'storage' | 'general';
  isSecret: boolean;
  label: string;
  /** DB ve env yoksa kullanılan varsayılan (yalnız public değerler için). */
  default?: string;
}

export const SETTINGS_REGISTRY: SettingDef[] = [
  // Auth
  {
    key: 'auth.google.clientId',
    env: 'GOOGLE_CLIENT_ID',
    category: 'auth',
    isSecret: false,
    label: 'Google Client ID (web,ios,android — virgülle)',
    // Public değer (frontend'de zaten görünür) — admin'den değiştirilebilir.
    default:
      '631576779866-6irru1m952kvcmpo6dt97vurvjnk5k24.apps.googleusercontent.com',
  },

  // Payment
  {
    key: 'payment.provider',
    env: 'PAYMENT_PROVIDER',
    category: 'payment',
    isSecret: false,
    label: 'Aktif ödeme sağlayıcı (mock | iyzico)',
  },
  {
    key: 'payment.iyzico.apiKey',
    env: 'IYZICO_API_KEY',
    category: 'payment',
    isSecret: true,
    label: 'Iyzico API Key',
  },
  {
    key: 'payment.iyzico.secret',
    env: 'IYZICO_SECRET',
    category: 'payment',
    isSecret: true,
    label: 'Iyzico Secret',
  },
  {
    key: 'payment.iyzico.baseUrl',
    env: 'IYZICO_BASE_URL',
    category: 'payment',
    isSecret: false,
    label: 'Iyzico API adresi (sandbox: https://sandbox-api.iyzipay.com · canlı: https://api.iyzipay.com)',
    default: 'https://sandbox-api.iyzipay.com',
  },

  // Maps (Mapbox) — public 'pk.' token (tarayıcıda görünür, Mapbox'ta URL/referrer kısıtlanmalı)
  {
    key: 'maps.mapbox.token',
    env: 'MAPBOX_TOKEN',
    category: 'general',
    isSecret: false,
    label: 'Mapbox public token (pk.…) — Mapbox panelinde lucaclub.com.tr URL kısıtı ekleyin',
  },

  // Push (OneSignal)
  {
    key: 'push.onesignal.appId',
    env: 'ONESIGNAL_APP_ID',
    category: 'push',
    isSecret: false,
    label: 'OneSignal App ID',
    // Public değer (frontend SDK'sında zaten görünür) — admin'den değiştirilebilir.
    default: 'd5fad9f5-c827-4650-8590-8e10e5a2b51a',
  },
  {
    key: 'push.onesignal.apiKey',
    env: 'ONESIGNAL_API_KEY',
    category: 'push',
    isSecret: true,
    label: 'OneSignal REST API Key',
  },

  // Mail (SMTP)
  { key: 'mail.smtp.host', env: 'SMTP_HOST', category: 'mail', isSecret: false, label: 'SMTP Host' },
  { key: 'mail.smtp.port', env: 'SMTP_PORT', category: 'mail', isSecret: false, label: 'SMTP Port' },
  { key: 'mail.smtp.user', env: 'SMTP_USER', category: 'mail', isSecret: false, label: 'SMTP User' },
  {
    key: 'mail.smtp.password',
    env: 'SMTP_PASSWORD',
    category: 'mail',
    isSecret: true,
    label: 'SMTP Password',
  },
  { key: 'mail.from', env: 'SMTP_FROM', category: 'mail', isSecret: false, label: 'Gönderen (From)' },

  // SMS (Netgsm)
  {
    key: 'sms.provider',
    env: 'SMS_PROVIDER',
    category: 'sms',
    isSecret: false,
    label: 'Aktif SMS sağlayıcı (mock | netgsm)',
  },
  {
    key: 'sms.sender',
    env: 'SMS_SENDER',
    category: 'sms',
    isSecret: false,
    label: 'SMS başlığı / gönderen adı (msgheader)',
  },
  {
    key: 'sms.netgsm.usercode',
    env: 'NETGSM_USERCODE',
    category: 'sms',
    isSecret: false,
    label: 'Netgsm kullanıcı kodu',
  },
  {
    key: 'sms.netgsm.password',
    env: 'NETGSM_PASSWORD',
    category: 'sms',
    isSecret: true,
    label: 'Netgsm şifresi',
  },

  // Storage (Cloudflare R2 / S3-uyumlu) — görsel & video yükleme (presigned PUT).
  // R2 credentials'ı buraya girin; bucket CORS'unu Cloudflare panelinden site origin'ine açın.
  {
    key: 'storage.endpoint',
    env: 'S3_ENDPOINT',
    category: 'storage',
    isSecret: false,
    label: 'Depolama Endpoint (R2: https://<accountid>.r2.cloudflarestorage.com)',
  },
  {
    key: 'storage.bucket',
    env: 'S3_BUCKET',
    category: 'storage',
    isSecret: false,
    label: 'Bucket adı',
  },
  {
    key: 'storage.accessKeyId',
    env: 'S3_ACCESS_KEY',
    category: 'storage',
    isSecret: true,
    label: 'Access Key ID (R2 API token)',
  },
  {
    key: 'storage.secretAccessKey',
    env: 'S3_SECRET_KEY',
    category: 'storage',
    isSecret: true,
    label: 'Secret Access Key',
  },
  {
    key: 'storage.region',
    env: 'S3_REGION',
    category: 'storage',
    isSecret: false,
    label: "Region (R2 için 'auto', MinIO için 'us-east-1')",
    default: 'auto',
  },
  {
    key: 'storage.publicBaseUrl',
    env: 'S3_PUBLIC_URL',
    category: 'storage',
    isSecret: false,
    label: 'Public URL tabanı (R2 public/custom domain, ör. https://cdn.lucaclub.com.tr) — boşsa nesneler herkese açık olmaz',
  },
];

export const REGISTRY_BY_KEY = new Map<string, SettingDef>(
  SETTINGS_REGISTRY.map((s) => [s.key, s]),
);
