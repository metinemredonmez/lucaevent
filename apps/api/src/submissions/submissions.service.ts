import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubmissionDto, SubmissionQueryDto } from './dto/submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateSubmissionDto) {
    return this.prisma.submission.create({
      data: {
        type: dto.type,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        subject: dto.subject,
        message: dto.message,
        payload: (dto.payload ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      select: { id: true },
    });
  }

  list(q: SubmissionQueryDto) {
    return this.prisma.submission.findMany({
      where: { type: q.type, status: q.status },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async setStatus(id: string, status: SubmissionStatus) {
    const existing = await this.prisma.submission.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Submission not found');
    return this.prisma.submission.update({ where: { id }, data: { status } });
  }
}
