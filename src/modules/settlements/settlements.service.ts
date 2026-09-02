import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { initialAvatar } from '../../common/utils/avatar.util';
import { CreateSettlementDto } from './dto/settlements.dto';

@Injectable()
export class SettlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, groupId?: string) {
    const settlements = await this.prisma.settlement.findMany({
      where: {
        OR: [{ fromId: userId }, { toId: userId }],
        ...(groupId ? { groupId } : {}),
      },
      include: { from: true, to: true },
      orderBy: { createdAt: 'desc' },
    });
    return settlements.map((s) => this.present(s));
  }

  async create(userId: string, dto: CreateSettlementDto) {
    // Idempotency check (§29)
    if (dto.idempotencyKey) {
      const existing = await this.prisma.settlement.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: { from: true, to: true },
      });
      if (existing) return this.present(existing);
    }

    const settlement = await this.prisma.settlement.create({
      data: {
        fromId: userId,
        toId: dto.toId,
        amount: dto.amount,
        currency: dto.currency ?? 'INR',
        groupId: dto.groupId ?? null,
        note: dto.note ?? null,
        idempotencyKey: dto.idempotencyKey ?? null,
        status: 'COMPLETED',
      },
      include: { from: true, to: true },
    });

    return this.present(settlement);
  }

  async get(userId: string, id: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id },
      include: { from: true, to: true },
    });
    if (!settlement) throw new NotFoundException('Settlement not found');
    if (settlement.fromId !== userId && settlement.toId !== userId) {
      throw new ForbiddenException('You are not a party to this settlement');
    }
    return this.present(settlement);
  }

  private present(s: any) {
    return {
      id: s.id,
      amount: s.amount,
      currency: s.currency,
      status: s.status,
      groupId: s.groupId,
      note: s.note,
      idempotencyKey: s.idempotencyKey,
      from: this.presentUser(s.from),
      to: this.presentUser(s.to),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
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
