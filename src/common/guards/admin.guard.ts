import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { getAdminConfig, verifyAdminToken } from '../utils/admin-token.util';

/**
 * Protects admin-only routes. Expects `Authorization: Bearer <adminToken>`
 * where the token was issued by AdminAuthService (env-credential login).
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers?.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Admin authentication required');
    }
    const token = header.slice('Bearer '.length).trim();
    const payload = verifyAdminToken(token, getAdminConfig().jwtSecret);
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired admin session');
    }
    req.admin = payload;
    return true;
  }
}
