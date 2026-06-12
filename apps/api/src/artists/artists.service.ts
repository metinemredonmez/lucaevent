import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ArtistCreateDto, ArtistUpdateDto } from './dto/artist.dto';

@Injectable()
export class ArtistsService {
  constructor(private readonly prisma: PrismaService) {}

  list(residentsOnly?: boolean) {
    return this.prisma.artist.findMany({
      where: residentsOnly ? { isResident: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async bySlug(slug: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { slug },
      include: {
        lineup: {
          include: {
            event: { select: { id: true, slug: true, title: true, startsAt: true, status: true } },
          },
          orderBy: { event: { startsAt: 'desc' } },
        },
      },
    });
    if (!artist) throw new NotFoundException('Artist not found');
    return artist;
  }

  byId(id: string) {
    return this.prisma.artist.findUniqueOrThrow({ where: { id } });
  }

  create(dto: ArtistCreateDto) {
    return this.prisma.artist.create({ data: dto });
  }

  update(id: string, dto: ArtistUpdateDto) {
    return this.prisma.artist.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.artist.delete({ where: { id } });
  }
}
