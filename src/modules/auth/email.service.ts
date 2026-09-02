import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/**
 * Email delivery via Resend (https://resend.com).
 *
 * Set EMAIL_PROVIDER=resend and RESEND_API_KEY in env to enable.
 * Falls back to a mock logger when EMAIL_PROVIDER is unset or "mock".
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: string;
  private readonly resend: Resend | null;
  private readonly fromAddress: string;
  private readonly appUrl: string;
  private readonly appName = 'SplitEZ';

  constructor(private readonly config: ConfigService) {
    this.provider = process.env.EMAIL_PROVIDER ?? 'mock';
    this.fromAddress = process.env.RESEND_FROM ?? 'SplitEZ <noreply@splitez.app>';
    this.appUrl = process.env.APP_URL ?? 'http://localhost:3000';

    if (this.provider === 'resend') {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        this.logger.error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
        this.resend = null;
      } else {
        this.resend = new Resend(apiKey);
      }
    } else {
      this.resend = null;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const link = `${this.appUrl}/api/v1/auth/verify-email?token=${token}`;

    if (this.provider === 'mock' || !this.resend) {
      this.logger.debug(`[MOCK EMAIL] Verification → ${email}`);
      this.logger.debug(`[MOCK EMAIL] Link: ${link}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromAddress,
        to: email,
        subject: `Verify your ${this.appName} account`,
        html: this.verificationTemplate(link),
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send verification email to ${email}`, err);
      throw err;
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const link = `${this.appUrl}/api/v1/auth/reset-password?token=${token}`;

    if (this.provider === 'mock' || !this.resend) {
      this.logger.debug(`[MOCK EMAIL] Password Reset → ${email}`);
      this.logger.debug(`[MOCK EMAIL] Link: ${link}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromAddress,
        to: email,
        subject: `Reset your ${this.appName} password`,
        html: this.resetPasswordTemplate(link),
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${email}`, err);
      throw err;
    }
  }

  isMock(): boolean {
    return this.provider === 'mock' || !this.resend;
  }

  // ---------------------------------------------------------------------------
  // Email templates
  // ---------------------------------------------------------------------------

  private verificationTemplate(link: string): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1a1a1a; margin-bottom: 24px;">Welcome to ${this.appName}! 👋</h2>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5;">
          Please verify your email address to get started.
        </p>
        <a href="${link}" style="display: inline-block; background: #4F46E5; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0;">
          Verify Email
        </a>
        <p style="color: #888; font-size: 13px; line-height: 1.5; margin-top: 32px;">
          If you didn't create an account, you can safely ignore this email.<br/>
          This link expires in 24 hours.
        </p>
      </div>
    `;
  }

  private resetPasswordTemplate(link: string): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1a1a1a; margin-bottom: 24px;">Reset your password</h2>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5;">
          We received a request to reset your ${this.appName} password.
        </p>
        <a href="${link}" style="display: inline-block; background: #4F46E5; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0;">
          Reset Password
        </a>
        <p style="color: #888; font-size: 13px; line-height: 1.5; margin-top: 32px;">
          If you didn't request this, you can safely ignore this email.<br/>
          This link expires in 24 hours.
        </p>
      </div>
    `;
  }
}
