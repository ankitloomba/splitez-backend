import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { SendOtpDto, VerifyOtpDto } from './dto/auth.dto';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
  ) {}

  private hash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  async sendOtp(dto: SendOtpDto) {
    const code = this.otp.generateCode();
    // Invalidate any prior live challenges for this phone.
    await this.prisma.otpChallenge.updateMany({
      where: { phone: dto.phone, consumed: false },
      data: { consumed: true },
    });
    await this.prisma.otpChallenge.create({
      data: {
        phone: dto.phone,
        codeHash: this.hash(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
    await this.otp.deliver(dto.phone, code);
    return {
      sent: true,
      phone: dto.phone,
      // Only surfaced by the mock provider to ease local/dev testing.
      devCode: this.otp.isMock() ? code : undefined,
    };
  }

  async resendOtp(dto: SendOtpDto) {
    return this.sendOtp(dto);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { phone: dto.phone, consumed: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge) {
      throw new BadRequestException('No active OTP. Request a new code.');
    }
    if (challenge.expiresAt < new Date()) {
      throw new BadRequestException('OTP expired. Request a new code.');
    }
    if (challenge.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('Too many attempts. Request a new code.');
    }
    if (challenge.codeHash !== this.hash(dto.code)) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Incorrect code');
    }

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumed: true },
    });

    let user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    let isNewUser = false;

    if (!user) {
      if (!dto.firstName) {
        throw new BadRequestException(
          'firstName is required to complete signup',
        );
      }
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          firstName: dto.firstName,
          lastName: dto.lastName ?? null,
          isVerified: true,
          preferences: { create: {} },
        },
      });
      isNewUser = true;
    } else if (!user.isVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    const tokens = await this.tokens.issue(user.id, user.phone);
    return { isNewUser, user: this.publicUser(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; phone: string };
    try {
      payload = await this.tokens.verifyRefresh(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException('User no longer exists');
    return this.tokens.issue(user.id, user.phone);
  }

  // Stateless JWT: logout is a client-side token discard in V1.
  async logout() {
    return { success: true };
  }

  private publicUser(u: {
    id: string;
    phone: string;
    firstName: string;
    lastName: string | null;
  }) {
    return {
      id: u.id,
      phone: u.phone,
      firstName: u.firstName,
      lastName: u.lastName,
    };
  }
}
