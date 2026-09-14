import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { initialAvatar } from '../../common/utils/avatar.util';

export interface BalanceEntry {
  userId: string;
  firstName: string;
  lastName: string | null;
  profilePicture: string | null;
  avatar: { initials: string; backgroundColor: string } | null;
  /** Positive = they owe you, negative = you owe them */
  netAmount: number;
  currency: string;
}

export interface SimplifiedDebt {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  currency: string;
}

@Injectable()
export class BalancesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compute net balances for the current user across all or filtered context.
   *
   * Logic: for every non-deleted expense the user is involved in,
   * - if user paid → each other participant owes user their shareAmount
   * - user's own split is subtracted (they don't owe themselves)
   * Settlements offset the balances.
   */
  async getBalances(
    userId: string,
    opts?: { groupId?: string; tripId?: string },
  ): Promise<BalanceEntry[]> {
    const balanceMap = new Map<string, number>(); // peerId → net amount

    // 1. Expenses where user paid
    const paidExpenses = await this.prisma.expense.findMany({
      where: {
        paidById: userId,
        isDeleted: false,
        ...(opts?.groupId ? { groupId: opts.groupId } : {}),
        ...(opts?.tripId ? { tripId: opts.tripId } : {}),
      },
      include: { splits: true },
    });

    for (const exp of paidExpenses) {
      for (const split of exp.splits) {
        if (split.userId === userId) continue; // skip self
        balanceMap.set(
          split.userId,
          (balanceMap.get(split.userId) ?? 0) + split.shareAmount,
        );
      }
    }

    // 2. Expenses where user has a split but didn't pay
    const owedExpenses = await this.prisma.expense.findMany({
      where: {
        isDeleted: false,
        paidById: { not: userId },
        splits: { some: { userId } },
        ...(opts?.groupId ? { groupId: opts.groupId } : {}),
        ...(opts?.tripId ? { tripId: opts.tripId } : {}),
      },
      include: { splits: { where: { userId } } },
    });

    for (const exp of owedExpenses) {
      const myShare = exp.splits[0]?.shareAmount ?? 0;
      balanceMap.set(
        exp.paidById,
        (balanceMap.get(exp.paidById) ?? 0) - myShare,
      );
    }

    // 3. Settlements offset
    const settlementsFrom = await this.prisma.settlement.findMany({
      where: {
        fromId: userId,
        status: 'COMPLETED',
        ...(opts?.groupId ? { groupId: opts.groupId } : {}),
      },
    });
    for (const s of settlementsFrom) {
      balanceMap.set(s.toId, (balanceMap.get(s.toId) ?? 0) + s.amount);
    }

    const settlementsTo = await this.prisma.settlement.findMany({
      where: {
        toId: userId,
        status: 'COMPLETED',
        ...(opts?.groupId ? { groupId: opts.groupId } : {}),
      },
    });
    for (const s of settlementsTo) {
      balanceMap.set(s.fromId, (balanceMap.get(s.fromId) ?? 0) - s.amount);
    }

    // 4. Fetch user details and build response
    const peerIds = [...balanceMap.keys()].filter((id) => balanceMap.get(id) !== 0);
    if (peerIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: peerIds } },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return peerIds.map((peerId) => {
      const u = userMap.get(peerId);
      return {
        userId: peerId,
        firstName: u?.firstName ?? 'Unknown',
        lastName: u?.lastName ?? null,
        profilePicture: u?.profilePicture ?? null,
        avatar:
          u?.profilePicture
            ? null
            : initialAvatar(peerId, u?.firstName ?? '?', u?.lastName ?? null),
        netAmount: balanceMap.get(peerId)!,
        currency: 'INR', // V1: single currency
      };
    });
  }

  /**
   * Simplified debts for a group — minimize the number of transactions
   * needed to settle all balances.
   */
  async getSimplifiedDebts(groupId: string): Promise<SimplifiedDebt[]> {
    // Get all members' balances relative to the group
    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      include: { user: true },
    });

    // Build net balance for each member within this group
    const netMap = new Map<string, number>();
    for (const m of members) {
      netMap.set(m.userId, 0);
    }

    const expenses = await this.prisma.expense.findMany({
      where: { groupId, isDeleted: false },
      include: { splits: true },
    });

    for (const exp of expenses) {
      for (const split of exp.splits) {
        if (split.userId === exp.paidById) continue;
        // payer is owed, splitter owes
        netMap.set(exp.paidById, (netMap.get(exp.paidById) ?? 0) + split.shareAmount);
        netMap.set(split.userId, (netMap.get(split.userId) ?? 0) - split.shareAmount);
      }
    }

    // Offset settlements
    const settlements = await this.prisma.settlement.findMany({
      where: { groupId, status: 'COMPLETED' },
    });
    for (const s of settlements) {
      netMap.set(s.fromId, (netMap.get(s.fromId) ?? 0) + s.amount);
      netMap.set(s.toId, (netMap.get(s.toId) ?? 0) - s.amount);
    }

    // Simplify: greedily match largest creditor with largest debtor
    const creditors: { id: string; amount: number }[] = [];
    const debtors: { id: string; amount: number }[] = [];

    for (const [id, net] of netMap) {
      if (net > 0) creditors.push({ id, amount: net });
      else if (net < 0) debtors.push({ id, amount: -net });
    }

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const userMap = new Map(members.map((m) => [m.userId, m.user]));
    const debts: SimplifiedDebt[] = [];

    let ci = 0;
    let di = 0;
    while (ci < creditors.length && di < debtors.length) {
      const transfer = Math.min(creditors[ci].amount, debtors[di].amount);
      if (transfer > 0) {
        const from = userMap.get(debtors[di].id);
        const to = userMap.get(creditors[ci].id);
        debts.push({
          fromId: debtors[di].id,
          fromName: `${from?.firstName ?? '?'} ${from?.lastName ?? ''}`.trim(),
          toId: creditors[ci].id,
          toName: `${to?.firstName ?? '?'} ${to?.lastName ?? ''}`.trim(),
          amount: transfer,
          currency: 'INR',
        });
      }
      creditors[ci].amount -= transfer;
      debtors[di].amount -= transfer;
      if (creditors[ci].amount === 0) ci++;
      if (debtors[di].amount === 0) di++;
    }

    return debts;
  }
}
