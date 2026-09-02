import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    endpoint: string;
    method: string;
    statusCode: number;
    duration: number;
    error?: string;
    userAgent?: string;
    ip?: string;
  }) {
    // Fire-and-forget — don't block the response
    this.prisma.serviceHealthLog
      .create({ data })
      .catch(() => {/* swallow */});
  }

  /** Error rate per endpoint over the last N hours. */
  async getErrorRate(hours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const rows: Array<{
      endpoint: string;
      total: bigint;
      errors: bigint;
    }> = await this.prisma.$queryRaw`
      SELECT "endpoint",
             COUNT(*) AS total,
             COUNT(*) FILTER (WHERE "statusCode" >= 400) AS errors
      FROM service_health_logs
      WHERE "createdAt" >= ${since}
      GROUP BY "endpoint"
      ORDER BY errors DESC
      LIMIT 50
    `;

    return rows.map((r) => ({
      endpoint: r.endpoint,
      total: Number(r.total),
      errors: Number(r.errors),
      errorRate: Number(r.total) > 0
        ? Math.round((Number(r.errors) / Number(r.total)) * 10000) / 100
        : 0,
    }));
  }

  /** Average response time per endpoint. */
  async getResponseTimes(hours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const rows: Array<{
      endpoint: string;
      avg_ms: number;
      p95_ms: number;
      count: bigint;
    }> = await this.prisma.$queryRaw`
      SELECT "endpoint",
             ROUND(AVG("duration"))::int AS avg_ms,
             ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "duration"))::int AS p95_ms,
             COUNT(*) AS count
      FROM service_health_logs
      WHERE "createdAt" >= ${since}
      GROUP BY "endpoint"
      ORDER BY avg_ms DESC
      LIMIT 50
    `;

    return rows.map((r) => ({
      endpoint: r.endpoint,
      avgMs: r.avg_ms,
      p95Ms: r.p95_ms,
      count: Number(r.count),
    }));
  }

  /** Status code distribution over time (hourly). */
  async getStatusOverTime(hours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const rows: Array<{
      hour: string;
      s2xx: bigint;
      s4xx: bigint;
      s5xx: bigint;
    }> = await this.prisma.$queryRaw`
      SELECT DATE_TRUNC('hour', "createdAt") AS hour,
             COUNT(*) FILTER (WHERE "statusCode" >= 200 AND "statusCode" < 300) AS s2xx,
             COUNT(*) FILTER (WHERE "statusCode" >= 400 AND "statusCode" < 500) AS s4xx,
             COUNT(*) FILTER (WHERE "statusCode" >= 500) AS s5xx
      FROM service_health_logs
      WHERE "createdAt" >= ${since}
      GROUP BY DATE_TRUNC('hour', "createdAt")
      ORDER BY hour
    `;

    return rows.map((r) => ({
      hour: r.hour,
      success: Number(r.s2xx),
      clientErrors: Number(r.s4xx),
      serverErrors: Number(r.s5xx),
    }));
  }

  /** Recent errors (last N). */
  async getRecentErrors(limit: number = 50) {
    return this.prisma.serviceHealthLog.findMany({
      where: { statusCode: { gte: 400 } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /** Uptime: percentage of non-5xx responses. */
  async getUptime(hours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const rows: Array<{ total: bigint; ok: bigint }> = await this.prisma.$queryRaw`
      SELECT COUNT(*) AS total,
             COUNT(*) FILTER (WHERE "statusCode" < 500) AS ok
      FROM service_health_logs
      WHERE "createdAt" >= ${since}
    `;

    const total = Number(rows[0]?.total ?? 0);
    const ok = Number(rows[0]?.ok ?? 0);

    return {
      total,
      ok,
      uptime: total > 0 ? Math.round((ok / total) * 10000) / 100 : 100,
      hours,
    };
  }
}
