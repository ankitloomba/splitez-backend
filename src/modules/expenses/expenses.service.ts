import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { initialAvatar } from '../../common/utils/avatar.util';
import { computeSplits } from './split-engine';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expenses.dto';

const EXPENSE_INCLUDE = {
  splits: { include: { user: true } },
  paidBy: true,
  createdBy: true,
  group: true,
  trip: true,
} as const;

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // -------------------------------------------------------------------------
  // List
  // -------------------------------------------------------------------------

  async listByGroup(userId: string, groupId: string) {
    await this.requireGroupMember(userId, groupId);
    const expenses = await this.prisma.expense.findMany({
      where: { groupId, isDeleted: false },
      include: EXPENSE_INCLUDE,
      orderBy: { date: 'desc' },
    });
    return expenses.map((e) => this.present(e));
  }

  async listByTrip(userId: string, tripId: string) {
    await this.requireTripMember(userId, tripId);
    const expenses = await this.prisma.expense.findMany({
      where: { tripId, isDeleted: false },
      include: EXPENSE_INCLUDE,
      orderBy: { date: 'desc' },
    });
    return expenses.map((e) => this.present(e));
  }

  async listByUser(userId: string) {
    const expenses = await this.prisma.expense.findMany({
      where: {
        isDeleted: false,
        OR: [
          { createdById: userId },
          { paidById: userId },
          { splits: { some: { userId } } },
        ],
      },
      include: EXPENSE_INCLUDE,
      orderBy: { date: 'desc' },
    });
    return expenses.map((e) => this.present(e));
  }

  // -------------------------------------------------------------------------
  // Create
  // -------------------------------------------------------------------------

  async create(userId: string, dto: CreateExpenseDto) {
    // Idempotency check (§29)
    if (dto.idempotencyKey) {
      const existing = await this.prisma.expense.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: EXPENSE_INCLUDE,
      });
      if (existing) return this.present(existing);
    }

    // Validate group/trip membership
    if (dto.groupId) await this.requireGroupMember(userId, dto.groupId);
    if (dto.tripId) await this.requireTripMember(userId, dto.tripId);

    // Compute splits via the engine
    const computed = computeSplits(dto.amount, dto.splitMethod, dto.splits);

    const expense = await this.prisma.expense.create({
      data: {
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency ?? 'INR',
        splitMethod: dto.splitMethod,
        category: dto.category ?? null,
        note: dto.note ?? null,
        receipt: dto.receipt ?? null,
        date: dto.date ? new Date(dto.date) : new Date(),
        createdById: userId,
        paidById: dto.paidById ?? userId,
        groupId: dto.groupId ?? null,
        tripId: dto.tripId ?? null,
        idempotencyKey: dto.idempotencyKey ?? null,
        splits: {
          create: computed.map((s) => ({
            userId: s.userId,
            shareAmount: s.shareAmount,
            percentageBps: s.percentageBps,
          })),
        },
      },
      include: EXPENSE_INCLUDE,
    });

    // Notify all split participants (except the creator)
    const splitUserIds = expense.splits
      .map((s: any) => s.userId)
      .filter((id: string) => id !== userId);

    if (splitUserIds.length > 0) {
      const creator = expense.createdBy;
      const creatorName = creator?.firstName ?? 'Someone';
      const amount = (expense.amount / 100).toFixed(2);
      const groupName = expense.group?.name;

      this.notifications
        .sendToMany(
          splitUserIds,
          'New Expense',
          `${creatorName} added "${expense.description}" for ₹${amount}${groupName ? ` in ${groupName}` : ''}`,
          'EXPENSE_CREATED',
          { expenseId: expense.id, groupId: expense.groupId ?? undefined },
        )
        .catch(() => {});
    }

    return this.present(expense);
  }

  // -------------------------------------------------------------------------
  // Get
  // -------------------------------------------------------------------------

  async get(userId: string, expenseId: string) {
    const expense = await this.findOrFail(expenseId);
    this.requireParticipant(userId, expense);
    return this.present(expense);
  }

  // -------------------------------------------------------------------------
  // Update
  // -------------------------------------------------------------------------

  async update(userId: string, expenseId: string, dto: UpdateExpenseDto) {
    const existing = await this.findOrFail(expenseId);
    this.requireParticipant(userId, existing);

    const newAmount = dto.amount ?? existing.amount;
    const newMethod = dto.splitMethod ?? existing.splitMethod;

    // If splits are provided, recompute; otherwise keep existing
    let splitData: { userId: string; shareAmount: number; percentageBps: number | null }[] | undefined;
    if (dto.splits) {
      const computed = computeSplits(newAmount, newMethod, dto.splits);
      splitData = computed;
    } else if (dto.amount || dto.splitMethod) {
      // Amount or method changed but no new splits provided — error
      throw new BadRequestException(
        'splits must be provided when changing amount or splitMethod',
      );
    }

    const expense = await this.prisma.$transaction(async (tx) => {
      if (splitData) {
        await tx.expenseSplit.deleteMany({ where: { expenseId } });
        await tx.expenseSplit.createMany({
          data: splitData.map((s) => ({
            expenseId,
            userId: s.userId,
            shareAmount: s.shareAmount,
            percentageBps: s.percentageBps,
          })),
        });
      }

      return tx.expense.update({
        where: { id: expenseId },
        data: {
          description: dto.description,
          amount: dto.amount,
          currency: dto.currency,
          splitMethod: dto.splitMethod,
          category: dto.category,
          note: dto.note,
          receipt: dto.receipt,
          date: dto.date ? new Date(dto.date) : undefined,
          paidById: dto.paidById,
        },
        include: EXPENSE_INCLUDE,
      });
    });

    return this.present(expense);
  }

  // -------------------------------------------------------------------------
  // Delete (soft)
  // -------------------------------------------------------------------------

  async remove(userId: string, expenseId: string) {
    const expense = await this.findOrFail(expenseId);
    this.requireParticipant(userId, expense);

    await this.prisma.expense.update({
      where: { id: expenseId },
      data: { isDeleted: true },
    });

    return { deleted: true };
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private async findOrFail(expenseId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: EXPENSE_INCLUDE,
    });
    if (!expense || expense.isDeleted) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  private requireParticipant(userId: string, expense: { createdById: string; paidById: string; splits: { userId: string }[] }) {
    const involved =
      expense.createdById === userId ||
      expense.paidById === userId ||
      expense.splits.some((s) => s.userId === userId);
    if (!involved) {
      throw new ForbiddenException('You are not a participant in this expense');
    }
  }

  private async requireGroupMember(userId: string, groupId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this group');
  }

  private async requireTripMember(userId: string, tripId: string) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this trip');
  }

  private present(expense: any) {
    return {
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      splitMethod: expense.splitMethod,
      category: expense.category,
      note: expense.note,
      receipt: expense.receipt,
      date: expense.date,
      idempotencyKey: expense.idempotencyKey,
      paidBy: this.presentUser(expense.paidBy),
      createdBy: this.presentUser(expense.createdBy),
      group: expense.group ? { id: expense.group.id, name: expense.group.name } : null,
      trip: expense.trip ? { id: expense.trip.id, name: expense.trip.name } : null,
      splits: expense.splits.map((s: any) => ({
        userId: s.userId,
        shareAmount: s.shareAmount,
        percentageBps: s.percentageBps,
        user: this.presentUser(s.user),
      })),
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }

  private presentUser(u: any) {
    if (!u) return null;
    return {
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      profilePicture: u.profilePicture,
      avatar: u.profilePicture
        ? null
        : initialAvatar(u.id, u.firstName, u.lastName),
    };
  }
}
