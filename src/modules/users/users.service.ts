import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { initialAvatar } from '../../common/utils/avatar.util';
import { UpdateMeDto, UpdatePreferencesDto } from './dto/users.dto';

const MANDATORY_TABS = ['home', 'more'];

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.present(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        currency: dto.currency,
        profilePicture: dto.profilePicture,
      },
      include: { preferences: true },
    });
    return this.present(user);
  }

  async setProfilePicture(userId: string, url: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { profilePicture: url },
      include: { preferences: true },
    });
    return this.present(user);
  }

  async getPreferences(userId: string) {
    const prefs = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });
    if (!prefs) throw new NotFoundException('Preferences not found');
    return prefs;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    if (dto.navigationOrder) {
      for (const tab of MANDATORY_TABS) {
        if (!dto.navigationOrder.includes(tab)) {
          throw new BadRequestException(
            `Navigation must include the mandatory "${tab}" tab`,
          );
        }
      }
    }
    return this.prisma.userPreferences.update({
      where: { userId },
      data: {
        navigationOrder: dto.navigationOrder,
        notificationSettings:
          dto.notificationSettings as Prisma.InputJsonValue | undefined,
      },
    });
  }

  private present(user: {
    id: string;
    phone: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    currency: string;
    profilePicture: string | null;
    isVerified: boolean;
    adFree: boolean;
    preferences: unknown;
  }) {
    return {
      id: user.id,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      currency: user.currency,
      profilePicture: user.profilePicture,
      isVerified: user.isVerified,
      adFree: user.adFree,
      // Deterministic fallback avatar until a photo is uploaded (§9)
      avatar: user.profilePicture
        ? null
        : initialAvatar(user.id, user.firstName, user.lastName),
      preferences: user.preferences ?? null,
    };
  }
}
