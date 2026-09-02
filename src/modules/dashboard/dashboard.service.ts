import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Active dashboard elements for a given screen, respecting schedule. */
  async getElements(targetScreen: string = 'home') {
    const now = new Date();
    return this.prisma.dashboardElement.findMany({
      where: {
        status: 'Active',
        targetScreen,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { position: 'asc' },
    });
  }
}
