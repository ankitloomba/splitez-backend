import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Self-contained HS256 JWT sign/verify for the admin panel.
 *
 * The admin panel authenticates against static env credentials
 * (ADMIN_USERNAME / ADMIN_PASSWORD) — independent of app users — and is
 * issued a short-lived token signed with ADMIN_JWT_SECRET. Kept dependency-
 * and DI-free so the AdminGuard can verify tokens from any module.
 */

export interface AdminConfig {
  username: string;
  password: string;
  jwtSecret: string;
  jwtTtl: number; // seconds
}

export function getAdminConfig(): AdminConfig {
  return {
    username: process.env.ADMIN_USERNAME ?? 'admin',
    password: process.env.ADMIN_PASSWORD ?? 'changeme',
    jwtSecret: process.env.ADMIN_JWT_SECRET ?? 'dev-admin-secret',
    jwtTtl: parseInt(process.env.ADMIN_JWT_TTL ?? '28800', 10), // 8h
  };
}

export interface AdminTokenPayload {
  sub: string;
  role: 'admin';
  iat: number;
  exp: number;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function sign(data: string, secret: string): string {
  return base64url(createHmac('sha256', secret).update(data).digest());
}

export function signAdminToken(
  subject: string,
  secret: string,
  ttlSeconds: number,
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      sub: subject,
      role: 'admin',
      iat: now,
      exp: now + ttlSeconds,
    }),
  );
  const signature = sign(`${header}.${payload}`, secret);
  return `${header}.${payload}.${signature}`;
}

export function verifyAdminToken(
  token: string,
  secret: string,
): AdminTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;

  const expected = sign(`${header}.${payload}`, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let decoded: AdminTokenPayload;
  try {
    decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  } catch {
    return null;
  }

  if (decoded.role !== 'admin') return null;
  if (typeof decoded.exp !== 'number' || decoded.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return decoded;
}
