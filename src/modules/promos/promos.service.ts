import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PromosService {
  constructor(private readonly prisma: PrismaService) {}

  /** Active banners for a given target screen. */
  async list(targetScreen?: string) {
    const now = new Date();
    return this.prisma.promotionalBanner.findMany({
      where: {
        status: 'Active',
        startDate: { lte: now },
        endDate: { gte: now },
        ...(targetScreen ? { targetScreen } : {}),
      },
      orderBy: { priority: 'desc' },
    });
  }
}
