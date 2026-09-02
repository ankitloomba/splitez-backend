import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** List all categories: system-wide + user's custom ones. */
  async list(userId?: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [{ isSystem: true }, ...(userId ? [{ ownerId: userId }] : [])],
      },
      orderBy: { name: 'asc' },
    });
  }
}
