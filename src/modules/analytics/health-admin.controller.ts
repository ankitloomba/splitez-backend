import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HealthTrackingService } from './health.service';
import { AdminGuard } from '../../common/guards/admin.guard';

@ApiTags('Admin – Service Health')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/health')
export class HealthAdminController {
  constructor(private readonly health: HealthTrackingService) {}

  @Get('error-rate')
  @ApiOperation({ summary: 'Error rate per endpoint' })
  getErrorRate(@Query('hours') hours?: string) {
    return this.health.getErrorRate(hours ? parseInt(hours, 10) : 24);
  }

  @Get('response-times')
  @ApiOperation({ summary: 'Avg & p95 response times per endpoint' })
  getResponseTimes(@Query('hours') hours?: string) {
    return this.health.getResponseTimes(hours ? parseInt(hours, 10) : 24);
  }

  @Get('status-over-time')
  @ApiOperation({ summary: 'Status code distribution by hour' })
  getStatusOverTime(@Query('hours') hours?: string) {
    return this.health.getStatusOverTime(hours ? parseInt(hours, 10) : 24);
  }

  @Get('recent-errors')
  @ApiOperation({ summary: 'Recent error responses' })
  getRecentErrors(@Query('limit') limit?: string) {
    return this.health.getRecentErrors(limit ? parseInt(limit, 10) : 50);
  }

  @Get('uptime')
  @ApiOperation({ summary: 'Uptime percentage' })
  getUptime(@Query('hours') hours?: string) {
    return this.health.getUptime(hours ? parseInt(hours, 10) : 24);
  }
}
