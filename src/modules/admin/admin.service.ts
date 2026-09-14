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

  // ── User base ───────────────────────────────────────────────────────

  /** High-level user-base metrics for the Overview screen. */
  async getUserStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, verified, newToday, new7d, new30d, withPhone] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isVerified: true } }),
        this.prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
        this.prisma.user.count({ where: { createdAt: { gte: last7 } } }),
        this.prisma.user.count({ where: { createdAt: { gte: last30 } } }),
        this.prisma.user.count({ where: { phone: { not: null } } }),
      ]);

    // Daily signups for the last 30 days (in-memory bucketing — small volumes).
    const recent = await this.prisma.user.findMany({
      where: { createdAt: { gte: last30 } },
      select: { createdAt: true },
    });
    const byDay = new Map<string, number>();
    for (const u of recent) {
      const key = u.createdAt.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    const signups: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      signups.push({ date: d, count: byDay.get(d) ?? 0 });
    }

    return {
      totalUsers: total,
      verifiedUsers: verified,
      verifiedPct: total ? Math.round((verified / total) * 1000) / 10 : 0,
      usersWithPhone: withPhone,
      newToday,
      new7d,
      new30d,
      signups,
    };
  }

  /** Paginated, searchable list of users. */
  async listUsers(params: { search?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
    const search = params.search?.trim();

    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          countryCode: true,
          currency: true,
          isVerified: true,
          emailVerified: true,
          adFree: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
      users,
    };
  }

  /** Single user with activity counts. */
  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        countryCode: true,
        currency: true,
        isVerified: true,
        emailVerified: true,
        adFree: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            groupMemberships: true,
            tripMemberships: true,
            expensesPaid: true,
            settlementsFrom: true,
            settlementsTo: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

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
