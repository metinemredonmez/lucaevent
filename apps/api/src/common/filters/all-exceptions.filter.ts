import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let code: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const anyRes = res as Record<string, unknown>;
        message = (anyRes.message as string | string[]) ?? message;
        code = anyRes.error as string | undefined;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Never leak internal error details (stack/Prisma/driver messages) to the
    // client on 5xx in production; log the real reason server-side instead.
    const isProd = process.env.NODE_ENV === 'production';
    const clientMessage =
      status >= 500 && isProd ? 'Internal server error' : message;

    const payload = {
      statusCode: status,
      error: code ?? HttpStatus[status],
      message: clientMessage,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} — ${status} — ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json(payload);
  }
}
