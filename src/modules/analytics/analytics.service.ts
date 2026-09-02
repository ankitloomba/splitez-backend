import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TrackEventDto } from './dto/analytics.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Event tracking ───────────────────────────────────────────────────

  async track(userId: string | null, dto: TrackEventDto) {
    return this.prisma.analyticsEvent.create({
      data: {
        userId,
        sessionId: dto.sessionId,
        event: dto.event,
        screen: dto.screen,
        action: dto.action,
        metadata: (dto.metadata ?? {}) as any,
        platform: dto.platform,
        appVersion: dto.appVersion,
      },
    });
  }

  async trackBatch(userId: string | null, events: TrackEventDto[]) {
    return this.prisma.analyticsEvent.createMany({
      data: events.map((e) => ({
        userId,
        sessionId: e.sessionId,
        event: e.event,
        screen: e.screen,
        action: e.action,
        metadata: (e.metadata ?? {}) as any,
        platform: e.platform,
        appVersion: e.appVersion,
      })),
    });
  }

  // ── DAU / MAU ────────────────────────────────────────────────────────

  /** Daily active users for the last N days (default 30). */
  async getDau(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows: Array<{ day: string; count: bigint }> = await this.prisma.$queryRaw`
      SELECT DATE("createdAt") AS day, COUNT(DISTINCT "userId") AS count
      FROM analytics_events
      WHERE "userId" IS NOT NULL AND "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY day
    `;

    return rows.map((r) => ({ day: r.day, count: Number(r.count) }));
  }

  /** Monthly active users for the last N months (default 12). */
  async getMau(months: number = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const rows: Array<{ month: string; count: bigint }> = await this.prisma.$queryRaw`
      SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(DISTINCT "userId") AS count
      FROM analytics_events
      WHERE "userId" IS NOT NULL AND "createdAt" >= ${since}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month
    `;

    return rows.map((r) => ({ month: r.month, count: Number(r.count) }));
  }

  /** DAU/MAU ratio (stickiness) for the current month. */
  async getStickiness() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const dauRows: Array<{ day: string; count: bigint }> = await this.prisma.$queryRaw`
      SELECT DATE("createdAt") AS day, COUNT(DISTINCT "userId") AS count
      FROM analytics_events
      WHERE "userId" IS NOT NULL AND "createdAt" >= ${monthStart}
      GROUP BY DATE("createdAt")
    `;

    const mauRows: Array<{ count: bigint }> = await this.prisma.$queryRaw`
      SELECT COUNT(DISTINCT "userId") AS count
      FROM analytics_events
      WHERE "userId" IS NOT NULL AND "createdAt" >= ${monthStart}
    `;

    const avgDau = dauRows.length
      ? dauRows.reduce((s, r) => s + Number(r.count), 0) / dauRows.length
      : 0;
    const mau = mauRows[0] ? Number(mauRows[0].count) : 0;

    return {
      avgDau: Math.round(avgDau * 100) / 100,
      mau,
      stickiness: mau > 0 ? Math.round((avgDau / mau) * 10000) / 100 : 0,
      daysTracked: dauRows.length,
    };
  }

  // ── User journeys ────────────────────────────────────────────────────

  /** Top screen flows (screen A → screen B transitions). */
  async getJourneys(days: number = 7, limit: number = 20) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows: Array<{ from_screen: string; to_screen: string; transitions: bigint }> =
      await this.prisma.$queryRaw`
        WITH ordered AS (
          SELECT "sessionId", "screen",
                 LAG("screen") OVER (PARTITION BY "sessionId" ORDER BY "createdAt") AS prev_screen
          FROM analytics_events
          WHERE "event" = 'screen_view' AND "screen" IS NOT NULL
                AND "sessionId" IS NOT NULL AND "createdAt" >= ${since}
        )
        SELECT prev_screen AS from_screen, "screen" AS to_screen, COUNT(*) AS transitions
        FROM ordered
        WHERE prev_screen IS NOT NULL AND prev_screen <> "screen"
        GROUP BY prev_screen, "screen"
        ORDER BY transitions DESC
        LIMIT ${limit}
      `;

    return rows.map((r) => ({
      from: r.from_screen,
      to: r.to_screen,
      count: Number(r.transitions),
    }));
  }

  /** Drop-off: where sessions end (last screen viewed per session). */
  async getDropOff(days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows: Array<{ screen: string; count: bigint }> = await this.prisma.$queryRaw`
      WITH last_screens AS (
        SELECT DISTINCT ON ("sessionId") "screen"
        FROM analytics_events
        WHERE "event" = 'screen_view' AND "screen" IS NOT NULL
              AND "sessionId" IS NOT NULL AND "createdAt" >= ${since}
        ORDER BY "sessionId", "createdAt" DESC
      )
      SELECT "screen", COUNT(*) AS count
      FROM last_screens
      GROUP BY "screen"
      ORDER BY count DESC
    `;

    return rows.map((r) => ({ screen: r.screen, count: Number(r.count) }));
  }

  /** Entry points: first screen viewed per session. */
  async getEntryPoints(days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows: Array<{ screen: string; count: bigint }> = await this.prisma.$queryRaw`
      WITH first_screens AS (
        SELECT DISTINCT ON ("sessionId") "screen"
        FROM analytics_events
        WHERE "event" = 'screen_view' AND "screen" IS NOT NULL
              AND "sessionId" IS NOT NULL AND "createdAt" >= ${since}
        ORDER BY "sessionId", "createdAt" ASC
      )
      SELECT "screen", COUNT(*) AS count
      FROM first_screens
      GROUP BY "screen"
      ORDER BY count DESC
    `;

    return rows.map((r) => ({ screen: r.screen, count: Number(r.count) }));
  }

  // ── Event breakdown ──────────────────────────────────────────────────

  async getEventBreakdown(days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows: Array<{ event: string; count: bigint }> = await this.prisma.$queryRaw`
      SELECT "event", COUNT(*) AS count
      FROM analytics_events
      WHERE "createdAt" >= ${since}
      GROUP BY "event"
      ORDER BY count DESC
    `;

    return rows.map((r) => ({ event: r.event, count: Number(r.count) }));
  }

  /** Platform breakdown (ios vs android vs web). */
  async getPlatformBreakdown(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows: Array<{ platform: string; users: bigint }> = await this.prisma.$queryRaw`
      SELECT COALESCE("platform", 'unknown') AS platform, COUNT(DISTINCT "userId") AS users
      FROM analytics_events
      WHERE "userId" IS NOT NULL AND "createdAt" >= ${since}
      GROUP BY COALESCE("platform", 'unknown')
      ORDER BY users DESC
    `;

    return rows.map((r) => ({ platform: r.platform, users: Number(r.users) }));
  }
}
