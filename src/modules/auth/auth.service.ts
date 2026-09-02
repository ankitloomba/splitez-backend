import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from './token.service';
import { EmailService } from './email.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

const BCRYPT_ROUNDS = 12;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly email: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const emailVerifyToken = randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName ?? null,
        phone: dto.phone ?? null,
        isVerified: false,
        emailVerified: false,
        emailVerifyToken,
        emailVerifyExpiry: new Date(Date.now() + TOKEN_TTL_MS),
        preferences: { create: {} },
      },
    });

    await this.email.sendVerificationEmail(user.email!, emailVerifyToken);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      user: this.publicUser(user),
      ...(this.email.isMock() ? { devVerifyToken: emailVerifyToken } : {}),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new BadRequestException(
        'Please verify your email before logging in. Check your inbox for the verification link.',
      );
    }

    const tokenPair = await this.tokens.issue(user.id, user.email!);
    return { user: this.publicUser(user), ...tokenPair };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { emailVerifyToken: dto.token },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    if (user.emailVerifyExpiry && user.emailVerifyExpiry < new Date()) {
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        isVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    const tokenPair = await this.tokens.issue(user.id, user.email!);
    return {
      message: 'Email verified successfully',
      user: this.publicUser(user),
      ...tokenPair,
    };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return { message: 'If the email is registered, a verification link has been sent.' };
    }
    if (user.emailVerified) {
      return { message: 'Email is already verified. You can log in.' };
    }

    const emailVerifyToken = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken,
        emailVerifyExpiry: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });
    await this.email.sendVerificationEmail(user.email!, emailVerifyToken);

    return {
      message: 'If the email is registered, a verification link has been sent.',
      ...(this.email.isMock() ? { devVerifyToken: emailVerifyToken } : {}),
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    const successMsg = 'If the email is registered, a password reset link has been sent.';
    if (!user || !user.passwordHash) {
      return { message: successMsg };
    }

    const passwordResetToken = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpiry: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });
    await this.email.sendPasswordResetEmail(user.email!, passwordResetToken);

    return {
      message: successMsg,
      ...(this.email.isMock() ? { devResetToken: passwordResetToken } : {}),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: dto.token },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    if (user.passwordResetExpiry && user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Reset token has expired. Please request a new one.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    return { message: 'Password reset successfully. You can now log in.' };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; identifier: string };
    try {
      payload = await this.tokens.verifyRefresh(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException('User no longer exists');
    return this.tokens.issue(user.id, user.email ?? user.id);
  }

  async logout() {
    return { success: true };
  }

  private publicUser(u: {
    id: string;
    phone?: string | null;
    email?: string | null;
    firstName: string;
    lastName: string | null;
  }) {
    return {
      id: u.id,
      email: u.email,
      phone: u.phone,
      firstName: u.firstName,
      lastName: u.lastName,
    };
  }
}
