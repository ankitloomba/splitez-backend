import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * OTP delivery abstraction.
 *
 * The provider is pluggable (Blueprint tech register: Firebase Phone Auth vs
 * MSG91/Twilio is still an open decision). For now `mock` returns a fixed
 * dev code so the full auth flow can be built and tested end-to-end. A real
 * provider will live in the `splitez-webservices` worker and be called here.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly provider: string;

  constructor(private readonly config: ConfigService) {
    this.provider = process.env.OTP_PROVIDER ?? 'mock';
  }

  /** Generate the code to send. Mock provider always uses 000000. */
  generateCode(): string {
    if (this.provider === 'mock') return '000000';
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /** Deliver the code to the phone. Mock provider just logs it. */
  async deliver(phone: string, code: string): Promise<void> {
    if (this.provider === 'mock') {
      this.logger.debug(`[MOCK OTP] ${phone} -> ${code}`);
      return;
    }
    // TODO: dispatch to splitez-webservices (MSG91 / Twilio / Firebase)
    this.logger.warn(`OTP provider "${this.provider}" not yet wired; code not sent`);
  }

  isMock(): boolean {
    return this.provider === 'mock';
  }
}
