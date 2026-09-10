import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Default system categories with emoji icons. */
const SYSTEM_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍔' },
  { name: 'Transport', icon: '🚗' },
  { name: 'Groceries', icon: '🛒' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Utilities', icon: '💡' },
  { name: 'Rent', icon: '🏠' },
  { name: 'Travel', icon: '✈️' },
  { name: 'Health', icon: '🏥' },
  { name: 'Education', icon: '📚' },
  { name: 'Subscriptions', icon: '📱' },
  { name: 'Gifts', icon: '🎁' },
  { name: 'Sports', icon: '⚽' },
  { name: 'Fuel', icon: '⛽' },
  { name: 'Other', icon: '📦' },
];

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Seed system categories if none exist. Called once on app bootstrap. */
  async seedDefaults() {
    const count = await this.prisma.category.count({ where: { isSystem: true } });
    if (count > 0) return;

    await this.prisma.category.createMany({
      data: SYSTEM_CATEGORIES.map((c) => ({
        name: c.name,
        icon: c.icon,
        isSystem: true,
        ownerId: null,
      })),
      skipDuplicates: true,
    });
  }

  /** List all categories: system-wide + user's custom ones. */
  async list(userId?: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [{ isSystem: true }, ...(userId ? [{ ownerId: userId }] : [])],
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Create a custom category for a user. */
  async create(userId: string, name: string, icon?: string) {
    return this.prisma.category.create({
      data: {
        name,
        icon: icon ?? '📦',
        isSystem: false,
        ownerId: userId,
      },
    });
  }

  /** Update a user's custom category. */
  async update(userId: string, id: string, name?: string, icon?: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    if (cat.isSystem) throw new ForbiddenException('Cannot edit system categories');
    if (cat.ownerId !== userId) throw new ForbiddenException('Not your category');

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(icon !== undefined && { icon }),
      },
    });
  }

  /** Delete a user's custom category. */
  async delete(userId: string, id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    if (cat.isSystem) throw new ForbiddenException('Cannot delete system categories');
    if (cat.ownerId !== userId) throw new ForbiddenException('Not your category');

    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}
