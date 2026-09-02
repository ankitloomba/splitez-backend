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
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  CreateBannerDto,
  UpdateBannerDto,
  CreateDashboardElementDto,
  UpdateDashboardElementDto,
} from './dto/admin.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
