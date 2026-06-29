import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { REGISTRY_BY_KEY, SETTINGS_REGISTRY } from './settings.registry';

const ENC_PREFIX = 'enc:v1:';

/**
 * Admin-managed runtime config (ADR-013). Resolves a setting as: DB value ->
 * env fallback -> ''. Secrets are AES-256-GCM encrypted at rest and masked in
 * the admin list. Services read here instead of ConfigService for integration
 * keys; bootstrap secrets stay in env.
 */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly cache = new Map<string, string | null>(); // decrypted DB values
  private loaded = false;
  private readonly encKey: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const secret =
      this.config.get<string>('SETTINGS_ENC_KEY') ||
      this.config.get<string>('JWT_REFRESH_SECRET') ||
      'luca-dev-fallback-key';
    this.encKey = createHash('sha256').update(secret).digest(); // 32 bytes
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    try {
      const rows = await this.prisma.setting.findMany();
      for (const r of rows) {
        const def = REGISTRY_BY_KEY.get(r.key);
        const val =
          r.value == null ? null : def?.isSecret ? this.decrypt(r.value) : r.value;
        this.cache.set(r.key, val);
      }
    } catch {
      // Setting tablosu yoksa (migration öncesi) çökme; env/default'a düşeriz.
    }
    this.loaded = true;
  }

  /** Resolved value: DB -> env fallback -> ''. */
  async get(key: string): Promise<string> {
    await this.ensureLoaded();
    const dbVal = this.cache.get(key);
    if (dbVal != null && dbVal !== '') return dbVal;

    const def = REGISTRY_BY_KEY.get(key);
    if (def) {
      const env = this.config.get<string>(def.env);
      if (env) return env;
      if (def.default) return def.default;
    }
    return '';
  }

  /** Admin list: every registry key with source + masked secrets. */
  async list() {
    await this.ensureLoaded();
    return SETTINGS_REGISTRY.map((def) => {
      const dbVal = this.cache.get(def.key);
      const hasDb = dbVal != null && dbVal !== '';
      const envVal = this.config.get<string>(def.env) ?? '';
      const hasEnv = Boolean(envVal);
      const source = hasDb ? 'db' : hasEnv ? 'env' : 'unset';
      const raw = hasDb ? (dbVal as string) : envVal;
      return {
        key: def.key,
        label: def.label,
        category: def.category,
        isSecret: def.isSecret,
        source,
        configured: source !== 'unset',
        value: def.isSecret ? this.mask(raw) : raw,
      };
    });
  }

  async set(key: string, value: string, updatedBy?: string) {
    const def = REGISTRY_BY_KEY.get(key);
    if (!def) throw new BadRequestException(`Unknown setting: ${key}`);

    const stored = def.isSecret && value ? this.encrypt(value) : value || null;
    await this.prisma.setting.upsert({
      where: { key },
      update: {
        value: stored,
        category: def.category,
        isSecret: def.isSecret,
        updatedBy,
      },
      create: {
        key,
        value: stored,
        category: def.category,
        isSecret: def.isSecret,
        updatedBy,
      },
    });
    this.cache.set(key, value || null);
    return { key, ok: true };
  }

  async setMany(items: { key: string; value: string }[], updatedBy?: string) {
    for (const it of items) await this.set(it.key, it.value, updatedBy);
    return { updated: items.length };
  }

  // ---- helpers ----

  private mask(v: string): string {
    if (!v) return '';
    if (v.length <= 4) return '••••';
    return v.slice(0, 2) + '••••' + v.slice(-2);
  }

  private encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encKey, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return ENC_PREFIX + Buffer.concat([iv, tag, enc]).toString('base64');
  }

  private decrypt(stored: string): string {
    if (!stored.startsWith(ENC_PREFIX)) return stored;
    try {
      const raw = Buffer.from(stored.slice(ENC_PREFIX.length), 'base64');
      const iv = raw.subarray(0, 12);
      const tag = raw.subarray(12, 28);
      const data = raw.subarray(28);
      const decipher = createDecipheriv('aes-256-gcm', this.encKey, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(data), decipher.final()]).toString(
        'utf8',
      );
    } catch {
      this.logger.error('Setting decrypt failed (encryption key changed?)');
      return '';
    }
  }
}
