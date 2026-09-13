import { Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import {
  getAdminConfig,
  signAdminToken,
} from '../../common/utils/admin-token.util';
import { AdminLoginDto } from './dto/admin-auth.dto';

@Injectable()
export class AdminAuthService {
  /** Validate static env credentials and issue a short-lived admin token. */
  login(dto: AdminLoginDto) {
    const cfg = getAdminConfig();

    const userOk = safeEquals(dto.username, cfg.username);
    const passOk = safeEquals(dto.password, cfg.password);
    if (!userOk || !passOk) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const token = signAdminToken(cfg.username, cfg.jwtSecret, cfg.jwtTtl);
    return {
      token,
      tokenType: 'Bearer',
      expiresIn: cfg.jwtTtl,
      username: cfg.username,
    };
  }
}

/** Constant-time string comparison that tolerates length mismatch. */
function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a ?? '');
  const bufB = Buffer.from(b ?? '');
  if (bufA.length !== bufB.length) {
    // Still run a comparison to reduce timing signal, then fail.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
