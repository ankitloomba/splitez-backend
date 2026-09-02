import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { initialAvatar } from '../../common/utils/avatar.util';
import { AddMembersDto, CreateGroupDto, UpdateGroupDto } from './dto/groups.dto';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(userId: string) {
    const groups = await this.prisma.group.findMany({
      where: { members: { some: { userId } } },
      include: { members: { include: { user: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return groups.map((g) => this.present(g));
  }

  async create(userId: string, dto: CreateGroupDto) {
    const memberIds = Array.from(
      new Set([userId, ...(dto.memberIds ?? [])]),
    );
    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        image: dto.image ?? null,
        members: {
          create: memberIds.map((id) => ({
            userId: id,
            role: id === userId ? 'admin' : 'member',
          })),
        },
      },
      include: { members: { include: { user: true } } },
    });

    // Notify other members they were added to the new group
    const otherMembers = memberIds.filter((id) => id !== userId);
    if (otherMembers.length > 0) {
      const creator = await this.prisma.user.findUnique({ where: { id: userId } });
      const creatorName = creator?.firstName ?? 'Someone';

      this.notifications
        .sendToMany(
          otherMembers,
          'New Group',
          `${creatorName} added you to "${group.name}"`,
          'GROUP_CREATED',
          { groupId: group.id },
        )
        .catch(() => {});
    }

    return this.present(group);
  }

  async get(userId: string, groupId: string) {
    const group = await this.requireMember(userId, groupId);
    return this.present(group);
  }

  async update(userId: string, groupId: string, dto: UpdateGroupDto) {
    await this.requireAdmin(userId, groupId);
    const group = await this.prisma.group.update({
      where: { id: groupId },
      data: dto,
      include: { members: { include: { user: true } } },
    });
    return this.present(group);
  }

  async remove(userId: string, groupId: string) {
    await this.requireAdmin(userId, groupId);
    await this.prisma.group.delete({ where: { id: groupId } });
    return { deleted: true };
  }

  async addMembers(userId: string, groupId: string, dto: AddMembersDto) {
    await this.requireMember(userId, groupId);
    await this.prisma.groupMember.createMany({
      data: dto.memberIds.map((id) => ({ groupId, userId: id })),
      skipDuplicates: true,
    });

    // Notify added members
    const adder = await this.prisma.user.findUnique({ where: { id: userId } });
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    const adderName = adder?.firstName ?? 'Someone';
    const groupName = group?.name ?? 'a group';

    this.notifications
      .sendToMany(
        dto.memberIds.filter((id) => id !== userId),
        'Added to Group',
        `${adderName} added you to "${groupName}"`,
        'GROUP_MEMBER_ADDED',
        { groupId },
      )
      .catch(() => {});

    return this.get(userId, groupId);
  }

  async removeMember(userId: string, groupId: string, memberId: string) {
    await this.requireAdmin(userId, groupId);
    await this.prisma.groupMember.deleteMany({
      where: { groupId, userId: memberId },
    });
    return { removed: true };
  }

  // --- guards ---

  private async requireMember(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { include: { user: true } } },
    });
    if (!group) throw new NotFoundException('Group not found');
    if (!group.members.some((m) => m.userId === userId)) {
      throw new ForbiddenException('You are not a member of this group');
    }
    return group;
  }

  private async requireAdmin(userId: string, groupId: string) {
    const group = await this.requireMember(userId, groupId);
    const me = group.members.find((m) => m.userId === userId);
    if (me?.role !== 'admin') {
      throw new ForbiddenException('Only a group admin can do this');
    }
    return group;
  }

  private present(group: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    members: {
      userId: string;
      role: string;
      user: {
        id: string;
        firstName: string;
        lastName: string | null;
        profilePicture: string | null;
      };
    }[];
  }) {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      image: group.image,
      memberCount: group.members.length,
      members: group.members.map((m) => ({
        id: m.user.id,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        role: m.role,
        profilePicture: m.user.profilePicture,
        avatar: m.user.profilePicture
          ? null
          : initialAvatar(m.user.id, m.user.firstName, m.user.lastName),
      })),
    };
  }
}
