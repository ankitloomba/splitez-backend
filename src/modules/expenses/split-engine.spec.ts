import { BadRequestException } from '@nestjs/common';
import { SplitMethod } from '@prisma/client';
import { computeSplits } from './split-engine';

describe('split-engine', () => {
  const u1 = 'aaaa-1111';
  const u2 = 'bbbb-2222';
  const u3 = 'cccc-3333';

  // -----------------------------------------------------------------------
  // EQUAL
  // -----------------------------------------------------------------------
  describe('EQUAL', () => {
    it('splits evenly among participants', () => {
      const splits = computeSplits(300, SplitMethod.EQUAL, [
        { userId: u1 },
        { userId: u2 },
        { userId: u3 },
      ]);
      expect(splits.map((s) => s.shareAmount)).toEqual([100, 100, 100]);
      expect(splits.reduce((s, x) => s + x.shareAmount, 0)).toBe(300);
    });

    it('distributes remainder paise round-robin', () => {
      const splits = computeSplits(100, SplitMethod.EQUAL, [
        { userId: u1 },
        { userId: u2 },
        { userId: u3 },
      ]);
      // 100 / 3 = 33 remainder 1
      expect(splits.map((s) => s.shareAmount)).toEqual([34, 33, 33]);
      expect(splits.reduce((s, x) => s + x.shareAmount, 0)).toBe(100);
    });

    it('handles single participant', () => {
      const splits = computeSplits(500, SplitMethod.EQUAL, [{ userId: u1 }]);
      expect(splits[0].shareAmount).toBe(500);
    });

    it('handles 2 remainder paise', () => {
      const splits = computeSplits(101, SplitMethod.EQUAL, [
        { userId: u1 },
        { userId: u2 },
        { userId: u3 },
      ]);
      // 101 / 3 = 33 remainder 2
      expect(splits.map((s) => s.shareAmount)).toEqual([34, 34, 33]);
      expect(splits.reduce((s, x) => s + x.shareAmount, 0)).toBe(101);
    });
  });

  // -----------------------------------------------------------------------
  // EXACT
  // -----------------------------------------------------------------------
  describe('EXACT', () => {
    it('accepts shares that sum to total', () => {
      const splits = computeSplits(1000, SplitMethod.EXACT, [
        { userId: u1, shareAmount: 600 },
        { userId: u2, shareAmount: 400 },
      ]);
      expect(splits.map((s) => s.shareAmount)).toEqual([600, 400]);
    });

    it('rejects shares that do not sum to total', () => {
      expect(() =>
        computeSplits(1000, SplitMethod.EXACT, [
          { userId: u1, shareAmount: 500 },
          { userId: u2, shareAmount: 400 },
        ]),
      ).toThrow(BadRequestException);
    });

    it('rejects missing shareAmount', () => {
      expect(() =>
        computeSplits(1000, SplitMethod.EXACT, [
          { userId: u1, shareAmount: 1000 },
          { userId: u2 },
        ]),
      ).toThrow(BadRequestException);
    });
  });

  // -----------------------------------------------------------------------
  // PERCENTAGE
  // -----------------------------------------------------------------------
  describe('PERCENTAGE', () => {
    it('splits by percentage with exact division', () => {
      const splits = computeSplits(10000, SplitMethod.PERCENTAGE, [
        { userId: u1, percentageBps: 5000 },
        { userId: u2, percentageBps: 5000 },
      ]);
      expect(splits.map((s) => s.shareAmount)).toEqual([5000, 5000]);
      expect(splits.reduce((s, x) => s + x.shareAmount, 0)).toBe(10000);
    });

    it('handles remainder paise in percentage split', () => {
      // 33.33% each of 100 paise
      const splits = computeSplits(100, SplitMethod.PERCENTAGE, [
        { userId: u1, percentageBps: 3333 },
        { userId: u2, percentageBps: 3333 },
        { userId: u3, percentageBps: 3334 },
      ]);
      // floor: 33 + 33 + 33 = 99, remainder 1 goes to first
      expect(splits.reduce((s, x) => s + x.shareAmount, 0)).toBe(100);
    });

    it('rejects basis points not summing to 10000', () => {
      expect(() =>
        computeSplits(1000, SplitMethod.PERCENTAGE, [
          { userId: u1, percentageBps: 5000 },
          { userId: u2, percentageBps: 4000 },
        ]),
      ).toThrow(BadRequestException);
    });

    it('preserves percentageBps for auditability', () => {
      const splits = computeSplits(1000, SplitMethod.PERCENTAGE, [
        { userId: u1, percentageBps: 7000 },
        { userId: u2, percentageBps: 3000 },
      ]);
      expect(splits[0].percentageBps).toBe(7000);
      expect(splits[1].percentageBps).toBe(3000);
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------
  describe('edge cases', () => {
    it('rejects empty participants', () => {
      expect(() => computeSplits(100, SplitMethod.EQUAL, [])).toThrow(
        BadRequestException,
      );
    });

    it('rejects duplicate userIds', () => {
      expect(() =>
        computeSplits(100, SplitMethod.EQUAL, [
          { userId: u1 },
          { userId: u1 },
        ]),
      ).toThrow(BadRequestException);
    });
  });
});
