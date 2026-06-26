import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * Writes an AuditLog row for every successful state-changing request on
 * sensitive paths (/admin/* and refunds). Captures actor, action, path params —
 * never the request body, so secrets/passwords are never persisted. Best-effort:
 * a failed audit write never breaks the request.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;
    const path: string = (req.originalUrl || req.url || '').split('?')[0];

    const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    const isSensitive =
      isMutation && (path.includes('/admin/') || path.includes('/refund'));
    if (!isSensitive) return next.handle();

    return next.handle().pipe(
      tap(() => {
        const user = req.user as { sub?: string } | undefined;
        const segments = path.split('/').filter(Boolean); // [api, v1, admin, events, ...]
        void this.prisma.auditLog
          .create({
            data: {
              actorId: user?.sub ?? null,
              action: `${method} ${path}`,
              entity: segments[3] ?? null,
              entityId: req.params?.id ?? req.params?.code ?? null,
              meta:
                req.params && Object.keys(req.params).length
                  ? { params: req.params }
                  : undefined,
            },
          })
          .catch(() => undefined);
      }),
    );
  }
}
