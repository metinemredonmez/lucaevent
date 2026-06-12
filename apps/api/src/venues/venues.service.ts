import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VenueCreateDto, VenueUpdateDto } from './dto/venue.dto';

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.venue.findMany({ orderBy: { name: 'asc' } });
  }

  async bySlug(slug: string) {
    const v = await this.prisma.venue.findUnique({ where: { slug } });
    if (!v) throw new NotFoundException('Venue not found');
    return v;
  }

  byId(id: string) {
    return this.prisma.venue.findUniqueOrThrow({ where: { id } });
  }

  create(dto: VenueCreateDto) {
    return this.prisma.venue.create({ data: dto });
  }

  update(id: string, dto: VenueUpdateDto) {
    return this.prisma.venue.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.venue.delete({ where: { id } });
  }
}
