import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateContentPageDto,
  UpdateContentPageDto,
} from './dto/content-page.dto';

@Injectable()
export class ContentPagesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Public (app-facing) ─────────────────────────────────────────────

  /** List all published pages (for app settings / footer links). */
  async listPublished(category?: string) {
    return this.prisma.contentPage.findMany({
      where: { published: true, ...(category ? { category } : {}) },
      select: {
        slug: true,
        title: true,
        category: true,
        sortOrder: true,
        metaTitle: true,
        metaDesc: true,
        updatedAt: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  /** Get one published page by slug (for rendering in-app). */
  async getBySlug(slug: string) {
    const page = await this.prisma.contentPage.findFirst({
      where: { slug, published: true },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  // ── Admin ───────────────────────────────────────────────────────────

  async listAll() {
    return this.prisma.contentPage.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  async getById(id: string) {
    const page = await this.prisma.contentPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Content page not found');
    return page;
  }

  async create(dto: CreateContentPageDto) {
    return this.prisma.contentPage.create({ data: dto });
  }

  async update(id: string, dto: UpdateContentPageDto) {
    await this.getById(id); // ensure exists
    return this.prisma.contentPage.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.getById(id);
    return this.prisma.contentPage.delete({ where: { id } });
  }
}
