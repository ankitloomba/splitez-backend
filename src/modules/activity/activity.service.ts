import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { initialAvatar } from '../../common/utils/avatar.util';

export type ActivityType =
  | 'EXPENSE_CREATED'
  | 'EXPENSE_UPDATED'
  | 'EXPENSE_DELETED'
  | 'SETTLEMENT_COMPLETED'
  | 'GROUP_CREATED'
  | 'GROUP_MEMBER_ADDED'
  | 'TRIP_CREATED'
  | 'TRIP_MEMBER_ADDED';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  /** Record an activity entry (called internally by other services). */
  async record(
    userId: string,
    type: ActivityType,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.activity.create({
      data: {
        userId,
        type,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
        metadata: (metadata ?? {}) as any,
      },
    });
  }

  /** List activities for the current user (their own actions). */
  async listForUser(userId: string, cursor?: string, limit = 20) {
    const activities = await this.prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { user: true },
    });

    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, limit) : activities;

    return {
      items: items.map((a) => this.present(a)),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  /** Feed: activities from people in the user's groups/trips. */
  async feed(userId: string, cursor?: string, limit = 20) {
    // Get group and trip IDs the user belongs to
    const [groupMemberships, tripMemberships] = await Promise.all([
      this.prisma.groupMember.findMany({
        where: { userId },
        select: { groupId: true },
      }),
      this.prisma.tripMember.findMany({
        where: { userId },
        select: { tripId: true },
      }),
    ]);

    const groupIds = groupMemberships.map((m) => m.groupId);
    const tripIds = tripMemberships.map((m) => m.tripId);

    // Get all members of those groups/trips
    const [groupMembers, tripMembers] = await Promise.all([
      groupIds.length
        ? this.prisma.groupMember.findMany({
            where: { groupId: { in: groupIds } },
            select: { userId: true },
          })
        : [],
      tripIds.length
        ? this.prisma.tripMember.findMany({
            where: { tripId: { in: tripIds } },
            select: { userId: true },
          })
        : [],
    ]);

    const peerIds = [
      ...new Set([
        ...groupMembers.map((m) => m.userId),
        ...tripMembers.map((m) => m.userId),
      ]),
    ];

    if (peerIds.length === 0) {
      return { items: [], nextCursor: null };
    }

    const activities = await this.prisma.activity.findMany({
      where: { userId: { in: peerIds } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { user: true },
    });

    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, limit) : activities;

    return {
      items: items.map((a) => this.present(a)),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  private present(a: any) {
    return {
      id: a.id,
      type: a.type,
      entityType: a.entityType,
      entityId: a.entityId,
      metadata: a.metadata,
      user: this.presentUser(a.user),
      createdAt: a.createdAt,
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
