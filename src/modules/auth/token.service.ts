import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issue(userId: string, identifier: string): Promise<TokenPair> {
    const accessTtl = this.config.get<number>('app.jwt.accessTtl')!;
    const refreshTtl = this.config.get<number>('app.jwt.refreshTtl')!;

    const payload = { sub: userId, identifier };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('app.jwt.accessSecret'),
      expiresIn: accessTtl,
    });
    const refreshToken = await this.jwt.signAsync(
      { ...payload, type: 'refresh' },
      {
        secret: this.config.get<string>('app.jwt.refreshSecret'),
        expiresIn: refreshTtl,
      },
    );
    return { accessToken, refreshToken, expiresIn: accessTtl };
  }

  async verifyRefresh(token: string): Promise<{ sub: string; identifier: string }> {
    return this.jwt.verifyAsync(token, {
      secret: this.config.get<string>('app.jwt.refreshSecret'),
    });
  }
}
