import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { initialAvatar } from '../../common/utils/avatar.util';
import { AddPersonDto, InvitePersonDto } from './dto/people.dto';

@Injectable()
export class PeopleService {
  constructor(private readonly prisma: PrismaService) {}

  /** People the current user has a relationship with. */
  async list(userId: string) {
    const rels = await this.prisma.relationship.findMany({
      where: { ownerId: userId },
      include: { peer: true },
      orderBy: { createdAt: 'desc' },
    });
    return rels.map((r) => this.present(r.peer));
  }

  async search(userId: string, q?: string) {
    const rels = await this.prisma.relationship.findMany({
      where: {
        ownerId: userId,
        ...(q
          ? {
              peer: {
                OR: [
                  { firstName: { contains: q, mode: 'insensitive' } },
                  { lastName: { contains: q, mode: 'insensitive' } },
                  { phone: { contains: q } },
                ],
              },
            }
          : {}),
      },
      include: { peer: true },
      take: 25,
    });
    return rels.map((r) => this.present(r.peer));
  }

  async get(userId: string, personId: string) {
    const rel = await this.prisma.relationship.findUnique({
      where: { ownerId_peerId: { ownerId: userId, peerId: personId } },
      include: { peer: true },
    });
    if (!rel) throw new NotFoundException('Person not in your contacts');
    return this.present(rel.peer);
  }

  /** Add an existing registered user (by phone) as a contact. */
  async add(userId: string, dto: AddPersonDto) {
    const peer = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (!peer) {
      throw new NotFoundException(
        'No registered user with that phone. Use /people/invite instead.',
      );
    }
    if (peer.id === userId) {
      throw new BadRequestException('You cannot add yourself');
    }
    await this.link(userId, peer.id);
    return this.present(peer);
  }

  /**
   * Invite a non-registered person. V1: create a placeholder unverified user
   * so they can be added to groups/expenses; they claim the account on signup
   * with the same phone. (Final non-user treatment: Blueprint §13, open decision.)
   */
  async invite(userId: string, dto: InvitePersonDto) {
    let peer = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (!peer) {
      peer = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          firstName: dto.name ?? dto.phone,
          isVerified: false,
        },
      });
    }
    if (peer.id === userId) {
      throw new BadRequestException('You cannot invite yourself');
    }
    await this.link(userId, peer.id);
    return { ...this.present(peer), invited: !peer.isVerified };
  }

  /** Create the relationship both ways so balances resolve from either side. */
  private async link(ownerId: string, peerId: string) {
    await this.prisma.$transaction([
      this.prisma.relationship.upsert({
        where: { ownerId_peerId: { ownerId, peerId } },
        create: { ownerId, peerId },
        update: {},
      }),
      this.prisma.relationship.upsert({
        where: { ownerId_peerId: { ownerId: peerId, peerId: ownerId } },
        create: { ownerId: peerId, peerId: ownerId },
        update: {},
      }),
    ]);
  }

  private present(u: {
    id: string;
    phone: string | null;
    firstName: string;
    lastName: string | null;
    profilePicture: string | null;
    isVerified: boolean;
  }) {
    return {
      id: u.id,
      phone: u.phone,
      firstName: u.firstName,
      lastName: u.lastName,
      profilePicture: u.profilePicture,
      isRegistered: u.isVerified,
      avatar: u.profilePicture
        ? null
        : initialAvatar(u.id, u.firstName, u.lastName),
    };
  }
}
