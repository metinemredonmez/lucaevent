import { randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationCreateDto, ReservationQueryDto } from './dto/reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateCode(): string {
    return 'LUCA-' + randomBytes(4).toString('hex').toUpperCase();
  }

  create(dto: ReservationCreateDto) {
    return this.prisma.reservation.create({
      data: {
        code: this.generateCode(),
        venueId: dto.venueId,
        eventId: dto.eventId,
        area: dto.area,
        date: new Date(dto.date),
        partySize: dto.partySize,
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        note: dto.note,
        payload: dto.payload as any,
        status: ReservationStatus.PENDING,
      },
    });
  }

  list(q: ReservationQueryDto) {
    return this.prisma.reservation.findMany({
      where: q.status ? { status: q.status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: q.take ?? 20,
      skip: q.skip ?? 0,
    });
  }

  private async setStatus(id: string, status: ReservationStatus) {
    const existing = await this.prisma.reservation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Reservation not found');
    return this.prisma.reservation.update({ where: { id }, data: { status } });
  }

  confirm(id: string) {
    return this.setStatus(id, ReservationStatus.CONFIRMED);
  }

  cancel(id: string) {
    return this.setStatus(id, ReservationStatus.CANCELED);
  }
}
