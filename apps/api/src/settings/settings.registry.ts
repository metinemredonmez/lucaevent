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
  category: 'auth' | 'payment' | 'push' | 'mail' | 'general';
  isSecret: boolean;
  label: string;
}

export const SETTINGS_REGISTRY: SettingDef[] = [
  // Auth
  {
    key: 'auth.google.clientId',
    env: 'GOOGLE_CLIENT_ID',
    category: 'auth',
    isSecret: false,
    label: 'Google Client ID (web,ios,android — virgülle)',
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

  // Push (OneSignal)
  {
    key: 'push.onesignal.appId',
    env: 'ONESIGNAL_APP_ID',
    category: 'push',
    isSecret: false,
    label: 'OneSignal App ID',
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
];

export const REGISTRY_BY_KEY = new Map<string, SettingDef>(
  SETTINGS_REGISTRY.map((s) => [s.key, s]),
);
