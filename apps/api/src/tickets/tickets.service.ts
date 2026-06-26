import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  myTickets(userId: string, email: string) {
    return this.prisma.issuedTicket.findMany({
      where: { order: { OR: [{ userId }, { email }] } },
      orderBy: { id: 'desc' },
      include: {
        order: {
          select: {
            event: { select: { title: true, slug: true, startsAt: true } },
          },
        },
        tier: { select: { name: true } },
      },
    });
  }

  async checkIn(code: string, doorUserId: string) {
    const ticket = await this.prisma.issuedTicket.findUnique({
      where: { code },
      include: { order: true },
    });

    if (!ticket) {
      return { status: 'INVALID' as const, reason: 'NOT_FOUND' };
    }
    if (ticket.order.status !== 'PAID') {
      return { status: 'INVALID' as const, reason: 'UNPAID' };
    }
    if (ticket.checkedIn) {
      return {
        status: 'ALREADY_USED' as const,
        checkedInAt: ticket.checkedInAt,
        holderName: ticket.holderName,
      };
    }

    // Atomic single-flip: a read-then-update lets two simultaneous scans of the
    // same QR both pass the `checkedIn` read and both succeed. Conditional
    // updateMany (where checkedIn:false) admits exactly one.
    const res = await this.prisma.issuedTicket.updateMany({
      where: { id: ticket.id, checkedIn: false },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
        checkedInBy: doorUserId,
      },
    });
    if (res.count === 0) {
      const fresh = await this.prisma.issuedTicket.findUnique({ where: { id: ticket.id } });
      return {
        status: 'ALREADY_USED' as const,
        checkedInAt: fresh?.checkedInAt,
        holderName: fresh?.holderName,
      };
    }

    return {
      status: 'OK' as const,
      holderName: ticket.holderName,
      eventId: ticket.order.eventId,
    };
  }

  async attendees(eventId: string) {
    const tickets = await this.prisma.issuedTicket.findMany({
      where: { order: { eventId } },
      orderBy: { id: 'asc' },
      include: {
        order: { select: { email: true } },
        tier: { select: { name: true } },
      },
    });

    return tickets.map((t) => ({
      holderName: t.holderName,
      email: t.order.email,
      tier: t.tier.name,
      checkedIn: t.checkedIn,
      checkedInAt: t.checkedInAt,
    }));
  }

  private csvEscape(value: unknown): string {
    let s = value === null || value === undefined ? '' : String(value);
    // Neutralize CSV/formula injection: spreadsheet apps execute cells that
    // start with = + - @ (or tab/CR). holderName/email come from user input.
    if (/^[=+\-@\t\r]/.test(s)) {
      s = "'" + s;
    }
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  async attendeesCsv(eventId: string): Promise<string> {
    const rows = await this.attendees(eventId);
    const header = ['holderName', 'email', 'tier', 'checkedIn', 'checkedInAt'];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push(
        [
          this.csvEscape(r.holderName),
          this.csvEscape(r.email),
          this.csvEscape(r.tier),
          this.csvEscape(r.checkedIn),
          this.csvEscape(r.checkedInAt ? r.checkedInAt.toISOString() : ''),
        ].join(','),
      );
    }
    return lines.join('\n');
  }
}
