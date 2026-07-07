import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  APP_URL: z.string().url(),
  WEB_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(2_592_000),

  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  SMTP_FROM: z.string().default('Luca <no-reply@luca.test>'),

  R2_ENDPOINT: z.string().optional().default(''),
  R2_BUCKET: z.string().optional().default(''),
  R2_ACCESS_KEY: z.string().optional().default(''),
  R2_SECRET_KEY: z.string().optional().default(''),
  R2_PUBLIC_URL: z.string().optional().default(''),

  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  IYZICO_API_KEY: z.string().optional().default(''),
  IYZICO_SECRET: z.string().optional().default(''),

  // Google Sign-In (ID-token verification). Comma-separated for multiple
  // audiences (web / ios / android client ids).
  GOOGLE_CLIENT_ID: z.string().optional().default(''),

  // OneSignal push notifications
  ONESIGNAL_APP_ID: z.string().optional().default(''),
  ONESIGNAL_API_KEY: z.string().optional().default(''),

  // Aktif ödeme sağlayıcı (Setting ile admin'den override edilir)
  PAYMENT_PROVIDER: z.string().optional().default('mock'),

  // S3 / MinIO (görsel upload — presigned PUT)
  S3_ENDPOINT: z.string().optional().default(''),
  S3_BUCKET: z.string().optional().default(''),
  S3_ACCESS_KEY: z.string().optional().default(''),
  S3_SECRET_KEY: z.string().optional().default(''),
  S3_PUBLIC_URL: z.string().optional().default(''),
  S3_REGION: z.string().optional().default('us-east-1'),
  // Admin-managed Setting secret'larını şifrelemek için anahtar (boşsa
  // JWT_REFRESH_SECRET'a düşer). Bkz. ADR-013.
  SETTINGS_ENC_KEY: z.string().optional().default(''),

  MUX_TOKEN_ID: z.string().optional().default(''),
  MUX_TOKEN_SECRET: z.string().optional().default(''),

  // WhatsApp → etkinlik ingest. ANTHROPIC_API_KEY boşsa parse regex fallback'e düşer.
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  ANTHROPIC_MODEL: z.string().optional().default('claude-haiku-4-5-20251001'),
  WA_WEBHOOK_SECRET: z.string().optional().default(''),

  SENTRY_DSN: z.string().optional().default(''),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

export type Env = z.infer<typeof schema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('\n❌ Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
    throw new Error('Environment validation failed');
  }
  return parsed.data;
}
