import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { MailService } from '../mail/mail.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthTokenType, Role } from '@prisma/client';

const TOKEN_TTL = {
  EMAIL_VERIFY: 24 * 3600, // 24h
  PASSWORD_RESET: 3600, // 1h
} as const;

interface GoogleTokenInfo {
  iss: string;
  aud: string;
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
}

const MAX_LOGIN_FAILS = 5;
const LOGIN_LOCK_MS = 15 * 60_000; // 15 min

@Injectable()
export class AuthService {
  // In-memory brute-force lockout (single-instance MVP; move to Redis for scale).
  private readonly loginAttempts = new Map<string, { fails: number; lockedUntil: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly cs: ConfigService,
    private readonly settings: SettingsService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new UnauthorizedException('Email already used');

    // DTO enforces kvkkConsent/termsAccepted === true; record the consent.
    const now = new Date();
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: await argon2.hash(dto.password),
        role: Role.VIEWER,
        phone: dto.phone,
        city: dto.city,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        interests: dto.interests ?? [],
        kvkkConsentAt: now,
        termsAcceptedAt: now,
        marketingOptIn: dto.marketingOptIn ?? false,
        consentVersion: '2026-06',
      },
    });
    await this.sendVerification(user.id, user.email, user.name);
    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const key = dto.email.toLowerCase();
    const rec = this.loginAttempts.get(key);
    if (rec && rec.lockedUntil > Date.now()) {
      throw new HttpException(
        'Too many failed attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash || !user.isActive) {
      this.registerLoginFail(key);
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) {
      this.registerLoginFail(key);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.loginAttempts.delete(key); // success → reset
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.issueTokens(user.id, user.email, user.role);
  }

  private registerLoginFail(key: string): void {
    const rec = this.loginAttempts.get(key) ?? { fails: 0, lockedUntil: 0 };
    rec.fails += 1;
    if (rec.fails >= MAX_LOGIN_FAILS) {
      rec.lockedUntil = Date.now() + LOGIN_LOCK_MS;
      rec.fails = 0;
    }
    this.loginAttempts.set(key, rec);
  }

  /**
   * Google Sign-In: the client (web/mobile) signs in with Google and posts the
   * resulting idToken here. We verify it against Google, then upsert the user
   * and issue our own JWT pair. Verification uses Google's tokeninfo endpoint
   * (no extra dependency); for scale, switch to local JWKS / google-auth-library.
   */
  /** Public: frontend'in Google butonunu başlatması için (clientId gizli değildir). */
  async googleConfig() {
    const raw = await this.settings.get('auth.google.clientId');
    const web = raw.split(',').map((s) => s.trim()).filter(Boolean)[0] ?? '';
    return { enabled: Boolean(web), clientId: web };
  }

  async loginWithGoogle(idToken: string) {
    const clientIds = (await this.settings.get('auth.google.clientId'))
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (clientIds.length === 0) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }

    let info: GoogleTokenInfo;
    try {
      const res = await fetch(
        'https://oauth2.googleapis.com/tokeninfo?id_token=' +
          encodeURIComponent(idToken),
      );
      if (!res.ok) throw new Error(`tokeninfo ${res.status}`);
      info = (await res.json()) as GoogleTokenInfo;
    } catch {
      throw new UnauthorizedException('Could not verify Google token');
    }

    if (!clientIds.includes(info.aud)) {
      throw new UnauthorizedException('Google token audience mismatch');
    }
    if (
      info.iss !== 'accounts.google.com' &&
      info.iss !== 'https://accounts.google.com'
    ) {
      throw new UnauthorizedException('Invalid Google token issuer');
    }
    const verified = info.email_verified === true || info.email_verified === 'true';
    if (!info.email || !verified) {
      throw new UnauthorizedException('Google email not verified');
    }

    const user = await this.prisma.user.upsert({
      where: { email: info.email },
      update: {
        googleId: info.sub,
        name: info.name ?? undefined,
        avatarUrl: info.picture ?? undefined,
        lastLoginAt: new Date(),
      },
      create: {
        email: info.email,
        name: info.name,
        avatarUrl: info.picture,
        googleId: info.sub,
        role: Role.VIEWER,
      },
    });
    if (!user.isActive) throw new UnauthorizedException('Account is disabled');

    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(record.user.id, record.user.email, record.user.role);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  /**
   * KVKK/GDPR right-to-erasure: anonymize PII and disable the account while
   * keeping order/review rows (referential integrity + accounting) detached
   * from identity. Sessions are revoked.
   */
  async deleteAccount(userId: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@deleted.luca`,
          name: null,
          phone: null,
          avatarUrl: null,
          passwordHash: null,
          googleId: null,
          city: null,
          birthDate: null,
          interests: [],
          isActive: false,
        },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.authToken.deleteMany({ where: { userId } }),
      this.prisma.favorite.deleteMany({ where: { userId } }),
    ]);
    return { ok: true };
  }

  // ---------- email verification & password reset ----------

  async verifyEmail(rawToken: string) {
    const at = await this.consumeToken(rawToken, AuthTokenType.EMAIL_VERIFY);
    await this.prisma.user.update({
      where: { id: at.userId },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });
    return { ok: true };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.isActive && !user.emailVerified) {
      await this.sendVerification(user.id, user.email, user.name);
    }
    return { ok: true }; // do not leak account existence
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.isActive) {
      const raw = await this.issueAuthToken(user.id, AuthTokenType.PASSWORD_RESET);
      await this.mail.sendPasswordResetEmail(
        user.email,
        user.name,
        `${this.webUrl()}/sifre-sifirla?token=${raw}`,
      );
    }
    return { ok: true }; // always 200 — no account enumeration
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const at = await this.consumeToken(rawToken, AuthTokenType.PASSWORD_RESET);
    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: at.userId },
        data: { passwordHash },
      }),
      // invalidate all sessions after a password reset
      this.prisma.refreshToken.updateMany({
        where: { userId: at.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { ok: true };
  }

  // ---------- token helpers ----------

  private async sendVerification(userId: string, email: string, name: string | null) {
    const raw = await this.issueAuthToken(userId, AuthTokenType.EMAIL_VERIFY);
    await this.mail.sendVerificationEmail(
      email,
      name,
      `${this.webUrl()}/dogrula?token=${raw}`,
    );
  }

  private async issueAuthToken(userId: string, type: AuthTokenType): Promise<string> {
    const raw = randomBytes(32).toString('base64url');
    // one active token per (user,type): drop older unused ones
    await this.prisma.authToken.deleteMany({ where: { userId, type, usedAt: null } });
    await this.prisma.authToken.create({
      data: {
        userId,
        type,
        tokenHash: this.hash(raw),
        expiresAt: new Date(Date.now() + TOKEN_TTL[type] * 1000),
      },
    });
    return raw;
  }

  private async consumeToken(rawToken: string, type: AuthTokenType) {
    const at = await this.prisma.authToken.findUnique({
      where: { tokenHash: this.hash(rawToken) },
      include: { user: { select: { isActive: true } } },
    });
    if (
      !at ||
      at.type !== type ||
      at.usedAt ||
      at.expiresAt < new Date() ||
      !at.user.isActive
    ) {
      throw new BadRequestException('Invalid or expired token');
    }
    await this.prisma.authToken.update({
      where: { id: at.id },
      data: { usedAt: new Date() },
    });
    return at;
  }

  private webUrl(): string {
    return (this.cs.get<string>('WEB_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  private async issueTokens(userId: string, email: string, role: Role) {
    const accessTtl = Number(this.cs.get('JWT_ACCESS_TTL') ?? 900);
    const refreshTtl = Number(this.cs.get('JWT_REFRESH_TTL') ?? 2_592_000);

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      { expiresIn: `${accessTtl}s` },
    );

    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(refreshToken),
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    return { accessToken, refreshToken, expiresIn: accessTtl };
  }

  private hash(v: string): string {
    return createHash('sha256').update(v).digest('hex');
  }
}
