import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto, TrackBatchDto, RegisterInstallDto } from './dto/analytics.dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  // ── Client-facing: track events ──────────────────────────────────────

  @Post('events')
  @ApiOperation({ summary: 'Track a single analytics event' })
  trackEvent(@Req() req: any, @Body() dto: TrackEventDto) {
    const userId = req.user?.sub ?? null;
    return this.analytics.track(userId, dto);
  }

  @Post('events/batch')
  @ApiOperation({ summary: 'Track a batch of analytics events' })
  trackBatch(@Req() req: any, @Body() dto: TrackBatchDto) {
    const userId = req.user?.sub ?? null;
    return this.analytics.trackBatch(userId, dto.events);
  }

  // ── Admin: metrics ───────────────────────────────────────────────────

  @Get('dau')
  @ApiOperation({ summary: 'Daily active users (last N days)' })
  getDau(@Query('days') days?: string) {
    return this.analytics.getDau(days ? parseInt(days, 10) : 30);
  }

  @Get('mau')
  @ApiOperation({ summary: 'Monthly active users (last N months)' })
  getMau(@Query('months') months?: string) {
    return this.analytics.getMau(months ? parseInt(months, 10) : 12);
  }

  @Get('stickiness')
  @ApiOperation({ summary: 'DAU/MAU stickiness ratio' })
  getStickiness() {
    return this.analytics.getStickiness();
  }

  @Get('journeys')
  @ApiOperation({ summary: 'Top screen-to-screen transitions' })
  getJourneys(@Query('days') days?: string, @Query('limit') limit?: string) {
    return this.analytics.getJourneys(
      days ? parseInt(days, 10) : 7,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('drop-off')
  @ApiOperation({ summary: 'Session drop-off points (last screen)' })
  getDropOff(@Query('days') days?: string) {
    return this.analytics.getDropOff(days ? parseInt(days, 10) : 7);
  }

  @Get('entry-points')
  @ApiOperation({ summary: 'Session entry points (first screen)' })
  getEntryPoints(@Query('days') days?: string) {
    return this.analytics.getEntryPoints(days ? parseInt(days, 10) : 7);
  }

  @Get('events/breakdown')
  @ApiOperation({ summary: 'Event type breakdown' })
  getEventBreakdown(@Query('days') days?: string) {
    return this.analytics.getEventBreakdown(days ? parseInt(days, 10) : 7);
  }

  @Get('platforms')
  @ApiOperation({ summary: 'Platform breakdown (iOS/Android/Web)' })
  getPlatformBreakdown(@Query('days') days?: string) {
    return this.analytics.getPlatformBreakdown(days ? parseInt(days, 10) : 30);
  }

  // ── App Installs ─────────────────────────────────────────────────────

  @Post('installs')
  @ApiOperation({ summary: 'Register or update an app install' })
  registerInstall(@Req() req: any, @Body() dto: RegisterInstallDto) {
    const userId = req.user?.sub ?? undefined;
    return this.analytics.registerInstall(dto, userId);
  }

  @Get('installs')
  @ApiOperation({ summary: 'Install stats: total, active, by platform, daily' })
  getInstallStats() {
    return this.analytics.getInstallStats();
  }
}
