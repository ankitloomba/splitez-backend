import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateBannerDto,
  UpdateBannerDto,
  CreateDashboardElementDto,
  UpdateDashboardElementDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Promotional Banners ─────────────────────────────────────────────

  async listBanners() {
    return this.prisma.promotionalBanner.findMany({
      orderBy: { priority: 'desc' },
    });
  }

  async getBanner(id: string) {
    const banner = await this.prisma.promotionalBanner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    return banner;
  }

  async createBanner(dto: CreateBannerDto) {
    return this.prisma.promotionalBanner.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        image: dto.image,
        cta: dto.cta,
        destination: dto.destination,
        targetScreen: dto.targetScreen,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        priority: dto.priority ?? 0,
        status: dto.status ?? 'Draft',
      },
    });
  }

  async updateBanner(id: string, dto: UpdateBannerDto) {
    await this.getBanner(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.promotionalBanner.update({ where: { id }, data: data as any });
  }

  async deleteBanner(id: string) {
    await this.getBanner(id);
    return this.prisma.promotionalBanner.delete({ where: { id } });
  }

  // ── Dashboard Elements ──────────────────────────────────────────────

  async listElements(targetScreen?: string) {
    return this.prisma.dashboardElement.findMany({
      where: targetScreen ? { targetScreen } : {},
      orderBy: { position: 'asc' },
    });
  }

  async getElement(id: string) {
    const el = await this.prisma.dashboardElement.findUnique({ where: { id } });
    if (!el) throw new NotFoundException('Dashboard element not found');
    return el;
  }

  async createElement(dto: CreateDashboardElementDto) {
    return this.prisma.dashboardElement.create({
      data: {
        type: dto.type,
        title: dto.title,
        subtitle: dto.subtitle,
        body: dto.body,
        image: dto.image,
        cta: dto.cta,
        destination: dto.destination,
        targetScreen: dto.targetScreen ?? 'home',
        position: dto.position ?? 0,
        config: (dto.config ?? {}) as any,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: dto.status ?? 'Draft',
      },
    });
  }

  async updateElement(id: string, dto: UpdateDashboardElementDto) {
    await this.getElement(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    if (dto.config !== undefined) data.config = dto.config as any;
    return this.prisma.dashboardElement.update({ where: { id }, data: data as any });
  }

  async deleteElement(id: string) {
    await this.getElement(id);
    return this.prisma.dashboardElement.delete({ where: { id } });
  }
}
