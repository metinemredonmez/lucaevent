import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/** Türkçe karakterleri sadeleştirip URL-uyumlu slug üretir. */
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'icerik'
  );
}

/** Prisma unique (P2002) ihlalini anlaşılır bir 409'a çevirir, değilse yeniden fırlatır. */
export function rethrowSlugConflict(e: unknown, slug?: string): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    throw new ConflictException(`Bu slug zaten kullanımda${slug ? `: ${slug}` : ''}.`);
  }
  throw e;
}
