import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HealthTrackingService } from './health.service';

@Injectable()
export class HealthTrackingMiddleware implements NestMiddleware {
  constructor(private readonly health: HealthTrackingService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      // Skip health checks and static assets from logging
      if (req.path === '/api/v1/health' || req.path.startsWith('/favicon')) return;

      this.health.log({
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration: Date.now() - start,
        error: res.statusCode >= 400 ? res.statusMessage : undefined,
        userAgent: req.get('user-agent'),
        ip: req.ip,
      });
    });

    next();
  }
}
