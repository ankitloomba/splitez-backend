import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get active ad placements for a screen + platform. Called by apps on load. */
  async getPlacementsForScreen(screen: string, platform: string) {
    return this.prisma.adPlacement.findMany({
      where: {
        screen,
        enabled: true,
        OR: [{ platform: 'all' }, { platform }],
      },
      select: {
        name: true,
        adType: true,
        position: true,
        adUnitIos: platform === 'ios' ? true : false,
        adUnitAndroid: platform === 'android' ? true : false,
        frequency: true,
        adFreeSkip: true,
      },
    });
  }

  /** Get all ad placements (admin). */
  async listAll() {
    return this.prisma.adPlacement.findMany({ orderBy: { screen: 'asc' } });
  }

  /** Create an ad placement (admin). */
  async create(data: {
    name: string;
    adType: string;
    platform?: string;
    screen: string;
    position?: string;
    adUnitIos?: string;
    adUnitAndroid?: string;
    enabled?: boolean;
    frequency?: number;
    adFreeSkip?: boolean;
  }) {
    return this.prisma.adPlacement.create({ data: data as any });
  }

  /** Update an ad placement (admin). */
  async update(id: string, data: Record<string, unknown>) {
    const existing = await this.prisma.adPlacement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Ad placement not found');
    return this.prisma.adPlacement.update({ where: { id }, data: data as any });
  }

  /** Delete an ad placement (admin). */
  async remove(id: string) {
    const existing = await this.prisma.adPlacement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Ad placement not found');
    return this.prisma.adPlacement.delete({ where: { id } });
  }
}
