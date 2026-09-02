import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { initialAvatar } from '../../common/utils/avatar.util';
import {
  AddTripMembersDto,
  CreateTripDto,
  UpdateTripDto,
} from './dto/trips.dto';

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const trips = await this.prisma.trip.findMany({
      where: { members: { some: { userId } } },
      include: { members: { include: { user: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return trips.map((t) => this.present(t));
  }

  async create(userId: string, dto: CreateTripDto) {
    const memberIds = Array.from(new Set([userId, ...(dto.memberIds ?? [])]));
    const trip = await this.prisma.trip.create({
      data: {
        name: dto.name,
        destination: dto.destination ?? null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        image: dto.image ?? null,
        members: { create: memberIds.map((id) => ({ userId: id })) },
      },
      include: { members: { include: { user: true } } },
    });
    return this.present(trip);
  }

  async get(userId: string, tripId: string) {
    return this.present(await this.requireMember(userId, tripId));
  }

  async update(userId: string, tripId: string, dto: UpdateTripDto) {
    await this.requireMember(userId, tripId);
    const trip = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        name: dto.name,
        destination: dto.destination,
        image: dto.image,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: { members: { include: { user: true } } },
    });
    return this.present(trip);
  }

  async remove(userId: string, tripId: string) {
    await this.requireMember(userId, tripId);
    await this.prisma.trip.delete({ where: { id: tripId } });
    return { deleted: true };
  }

  async addMembers(userId: string, tripId: string, dto: AddTripMembersDto) {
    await this.requireMember(userId, tripId);
    await this.prisma.tripMember.createMany({
      data: dto.memberIds.map((id) => ({ tripId, userId: id })),
      skipDuplicates: true,
    });
    return this.get(userId, tripId);
  }

  private async requireMember(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: { include: { user: true } } },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (!trip.members.some((m) => m.userId === userId)) {
      throw new ForbiddenException('You are not a member of this trip');
    }
    return trip;
  }

  private present(trip: {
    id: string;
    name: string;
    destination: string | null;
    startDate: Date | null;
    endDate: Date | null;
    image: string | null;
    members: {
      userId: string;
      user: {
        id: string;
        firstName: string;
        lastName: string | null;
        profilePicture: string | null;
      };
    }[];
  }) {
    return {
      id: trip.id,
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      image: trip.image,
      memberCount: trip.members.length,
      members: trip.members.map((m) => ({
        id: m.user.id,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        profilePicture: m.user.profilePicture,
        avatar: m.user.profilePicture
          ? null
          : initialAvatar(m.user.id, m.user.firstName, m.user.lastName),
      })),
    };
  }
}
