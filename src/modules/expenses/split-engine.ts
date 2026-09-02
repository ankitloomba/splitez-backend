import { BadRequestException } from '@nestjs/common';
import { SplitMethod } from '@prisma/client';
import { SplitParticipantDto } from './dto/expenses.dto';

/**
 * Split Engine — the backend is the source of truth for all financial
 * calculations (Blueprint §19). Amounts are integer minor units (paise/cents).
 * The sum of computed shares MUST equal the expense total exactly.
 */

export interface ComputedSplit {
  userId: string;
  shareAmount: number;
  percentageBps: number | null;
}

/**
 * Compute the share each participant owes.
 *
 * EQUAL:      Divide evenly; remainder paise distributed round-robin.
 * EXACT:      Shares provided by client; must sum to total.
 * PERCENTAGE: Basis points (10000 = 100%); must sum to 10000; remainder
 *             paise distributed round-robin after floor division.
 */
export function computeSplits(
  totalAmount: number,
  method: SplitMethod,
  participants: SplitParticipantDto[],
): ComputedSplit[] {
  if (participants.length === 0) {
    throw new BadRequestException('At least one split participant is required');
  }

  const uniqueIds = new Set(participants.map((p) => p.userId));
  if (uniqueIds.size !== participants.length) {
    throw new BadRequestException('Duplicate userId in splits');
  }

  switch (method) {
    case SplitMethod.EQUAL:
      return equalSplit(totalAmount, participants);
    case SplitMethod.EXACT:
      return exactSplit(totalAmount, participants);
    case SplitMethod.PERCENTAGE:
      return percentageSplit(totalAmount, participants);
    default:
      throw new BadRequestException(`Unknown split method: ${method}`);
  }
}

// ---------------------------------------------------------------------------
// EQUAL
// ---------------------------------------------------------------------------

function equalSplit(
  total: number,
  participants: SplitParticipantDto[],
): ComputedSplit[] {
  const n = participants.length;
  const base = Math.floor(total / n);
  let remainder = total - base * n; // 0 <= remainder < n

  return participants.map((p) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { userId: p.userId, shareAmount: base + extra, percentageBps: null };
  });
}

// ---------------------------------------------------------------------------
// EXACT
// ---------------------------------------------------------------------------

function exactSplit(
  total: number,
  participants: SplitParticipantDto[],
): ComputedSplit[] {
  const splits: ComputedSplit[] = [];
  let sum = 0;

  for (const p of participants) {
    if (p.shareAmount == null) {
      throw new BadRequestException(
        `shareAmount is required for EXACT split (missing for user ${p.userId})`,
      );
    }
    if (p.shareAmount < 0) {
      throw new BadRequestException('shareAmount cannot be negative');
    }
    sum += p.shareAmount;
    splits.push({
      userId: p.userId,
      shareAmount: p.shareAmount,
      percentageBps: null,
    });
  }

  if (sum !== total) {
    throw new BadRequestException(
      `EXACT split shares (${sum}) do not equal expense total (${total})`,
    );
  }

  return splits;
}

// ---------------------------------------------------------------------------
// PERCENTAGE
// ---------------------------------------------------------------------------

function percentageSplit(
  total: number,
  participants: SplitParticipantDto[],
): ComputedSplit[] {
  let bpsSum = 0;
  for (const p of participants) {
    if (p.percentageBps == null) {
      throw new BadRequestException(
        `percentageBps is required for PERCENTAGE split (missing for user ${p.userId})`,
      );
    }
    if (p.percentageBps < 0) {
      throw new BadRequestException('percentageBps cannot be negative');
    }
    bpsSum += p.percentageBps;
  }

  if (bpsSum !== 10000) {
    throw new BadRequestException(
      `PERCENTAGE split basis points must sum to 10000 (got ${bpsSum})`,
    );
  }

  // Floor each share, then distribute remainder paise round-robin
  const splits: ComputedSplit[] = participants.map((p) => ({
    userId: p.userId,
    shareAmount: Math.floor((total * p.percentageBps!) / 10000),
    percentageBps: p.percentageBps!,
  }));

  let allocated = splits.reduce((s, x) => s + x.shareAmount, 0);
  let remainder = total - allocated;

  // Distribute leftover paise to participants in order
  for (let i = 0; remainder > 0; i++) {
    splits[i % splits.length].shareAmount += 1;
    remainder -= 1;
  }

  return splits;
}
