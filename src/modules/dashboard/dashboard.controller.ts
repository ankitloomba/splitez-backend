import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('elements')
  @ApiOperation({ summary: 'Get active dashboard elements for a screen' })
  @ApiQuery({ name: 'screen', required: false, example: 'home' })
  getElements(@Query('screen') screen?: string) {
    return this.dashboardService.getElements(screen || 'home');
  }
}
