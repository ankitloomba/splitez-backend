import { Injectable, Logger } from '@nestjs/common';

/**
 * Email delivery abstraction.
 *
 * Mock provider logs emails to console for local/dev testing.
 * A real provider (SendGrid / SES) will live in splitez-webservices.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: string;

  constructor() {
    this.provider = process.env.EMAIL_PROVIDER ?? 'mock';
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const link = `${process.env.APP_URL ?? 'http://localhost:3000'}/api/v1/auth/verify-email?token=${token}`;
    if (this.provider === 'mock') {
      this.logger.debug(`[MOCK EMAIL] Verification → ${email}`);
      this.logger.debug(`[MOCK EMAIL] Link: ${link}`);
      return;
    }
    // TODO: dispatch to splitez-webservices (SendGrid / SES)
    this.logger.warn(`Email provider "${this.provider}" not yet wired`);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const link = `${process.env.APP_URL ?? 'http://localhost:3000'}/api/v1/auth/reset-password?token=${token}`;
    if (this.provider === 'mock') {
      this.logger.debug(`[MOCK EMAIL] Password Reset → ${email}`);
      this.logger.debug(`[MOCK EMAIL] Link: ${link}`);
      return;
    }
    this.logger.warn(`Email provider "${this.provider}" not yet wired`);
  }

  isMock(): boolean {
    return this.provider === 'mock';
  }
}
