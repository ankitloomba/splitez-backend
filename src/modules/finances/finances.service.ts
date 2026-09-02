import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateIncomeDto,
  CreatePersonalExpenseDto,
} from './dto/finances.dto';

@Injectable()
export class FinancesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Income ────────────────────────────────────────────────────────────

  async listIncome(userId: string, cursor?: string, limit = 20) {
    const items = await this.prisma.income.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return {
      items: page,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  async createIncome(userId: string, dto: CreateIncomeDto) {
    return this.prisma.income.create({
      data: {
        userId,
        amount: dto.amount,
        type: dto.type,
        date: dto.date ? new Date(dto.date) : new Date(),
        note: dto.note ?? null,
      },
    });
  }

  async deleteIncome(userId: string, id: string) {
    const income = await this.prisma.income.findUnique({ where: { id } });
    if (!income || income.userId !== userId) throw new NotFoundException();
    await this.prisma.income.delete({ where: { id } });
    return { success: true };
  }

  // ── Personal Expenses ─────────────────────────────────────────────────

  async listPersonalExpenses(userId: string, cursor?: string, limit = 20) {
    const items = await this.prisma.personalExpense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return {
      items: page,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  async createPersonalExpense(userId: string, dto: CreatePersonalExpenseDto) {
    return this.prisma.personalExpense.create({
      data: {
        userId,
        amount: dto.amount,
        description: dto.description,
        category: dto.category ?? null,
        date: dto.date ? new Date(dto.date) : new Date(),
        note: dto.note ?? null,
      },
    });
  }

  async deletePersonalExpense(userId: string, id: string) {
    const expense = await this.prisma.personalExpense.findUnique({
      where: { id },
    });
    if (!expense || expense.userId !== userId) throw new NotFoundException();
    await this.prisma.personalExpense.delete({ where: { id } });
    return { success: true };
  }

  // ── Summary ───────────────────────────────────────────────────────────

  async summary(userId: string, month?: string) {
    // month format: "2026-09" — filters to that calendar month
    const dateFilter = month
      ? {
          date: {
            gte: new Date(`${month}-01T00:00:00Z`),
            lt: new Date(
              new Date(`${month}-01T00:00:00Z`).getTime() +
                32 * 24 * 60 * 60 * 1000,
            ),
          },
        }
      : {};

    // Correct monthly boundary
    let dateGte: Date | undefined;
    let dateLt: Date | undefined;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      dateGte = new Date(Date.UTC(y, m - 1, 1));
      dateLt = new Date(Date.UTC(y, m, 1));
    }

    const where = {
      userId,
      ...(dateGte && dateLt ? { date: { gte: dateGte, lt: dateLt } } : {}),
    };

    const [incomeAgg, expenseAgg] = await Promise.all([
      this.prisma.income.aggregate({ where, _sum: { amount: true } }),
      this.prisma.personalExpense.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = incomeAgg._sum.amount ?? 0;
    const totalExpenses = expenseAgg._sum.amount ?? 0;

    return {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      month: month ?? null,
    };
  }
}
