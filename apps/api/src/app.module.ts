import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';

import { validateEnv } from './config/env.schema';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { VenuesModule } from './venues/venues.module';
import { ArtistsModule } from './artists/artists.module';
import { CategoriesModule } from './categories/categories.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { TicketsModule } from './tickets/tickets.module';
import { StatsModule } from './stats/stats.module';
import { ReservationsModule } from './reservations/reservations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { MailModule } from './mail/mail.module';
import { EventSeriesModule } from './event-series/event-series.module';
import { JobsModule } from './jobs/jobs.module';
import { SocialModule } from './social/social.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { CouponsModule } from './coupons/coupons.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { UploadsModule } from './uploads/uploads.module';
import { SubmissionsModule } from './submissions/submissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.dev', '.env.prod', '.env'],
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true, colorize: true } },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    EventsModule,
    VenuesModule,
    ArtistsModule,
    CategoriesModule,
    BookingsModule,
    PaymentsModule,
    TicketsModule,
    StatsModule,
    ReservationsModule,
    NotificationsModule,
    SettingsModule,
    MailModule,
    EventSeriesModule,
    JobsModule,
    SocialModule,
    WaitlistModule,
    CouponsModule,
    SubscribersModule,
    UploadsModule,
    SubmissionsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Order matters: rate-limit → authenticate (deny-by-default, @Public opt-out)
    // → authorize (@Roles). Every route without @Public now requires a valid JWT.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // audit trail for sensitive mutations (/admin/*, refunds)
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
