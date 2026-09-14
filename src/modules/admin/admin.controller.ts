import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import {
  CreateBannerDto,
  UpdateBannerDto,
  CreateDashboardElementDto,
  UpdateDashboardElementDto,
} from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── User base ────────────────────────────────────────────────────────

  @Get('users/stats')
  @ApiOperation({ summary: 'User-base metrics (totals, new, verified, signups)' })
  getUserStats() {
    return this.adminService.getUserStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List users (search + paginate)' })
  listUsers(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.listUsers({
      search,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get a user by ID (with activity counts)' })
  getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUser(id);
  }

  // ── Banners ──────────────────────────────────────────────────────────

  @Get('banners')
  @ApiOperation({ summary: 'List all promotional banners (admin)' })
  listBanners() {
    return this.adminService.listBanners();
  }

  @Get('banners/:id')
  @ApiOperation({ summary: 'Get a banner by ID' })
  getBanner(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getBanner(id);
  }

  @Post('banners')
  @ApiOperation({ summary: 'Create a promotional banner' })
  createBanner(@Body() dto: CreateBannerDto) {
    return this.adminService.createBanner(dto);
  }

  @Put('banners/:id')
  @ApiOperation({ summary: 'Update a promotional banner' })
  updateBanner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBannerDto,
  ) {
    return this.adminService.updateBanner(id, dto);
  }

  @Delete('banners/:id')
  @ApiOperation({ summary: 'Delete a promotional banner' })
  deleteBanner(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteBanner(id);
  }

  // ── Dashboard Elements ───────────────────────────────────────────────

  @Get('dashboard-elements')
  @ApiOperation({ summary: 'List all dashboard elements (admin)' })
  listElements(@Query('targetScreen') targetScreen?: string) {
    return this.adminService.listElements(targetScreen);
  }

  @Get('dashboard-elements/:id')
  @ApiOperation({ summary: 'Get a dashboard element by ID' })
  getElement(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getElement(id);
  }

  @Post('dashboard-elements')
  @ApiOperation({ summary: 'Create a dashboard element' })
  createElement(@Body() dto: CreateDashboardElementDto) {
    return this.adminService.createElement(dto);
  }

  @Put('dashboard-elements/:id')
  @ApiOperation({ summary: 'Update a dashboard element' })
  updateElement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDashboardElementDto,
  ) {
    return this.adminService.updateElement(id, dto);
  }

  @Delete('dashboard-elements/:id')
  @ApiOperation({ summary: 'Delete a dashboard element' })
  deleteElement(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteElement(id);
  }
}
